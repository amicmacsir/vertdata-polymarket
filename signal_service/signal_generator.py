"""
VertData Signal Generator
FastAPI service for scoring Polymarket markets and generating trade signals
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
import json
import random
import string
from datetime import datetime, timezone
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(
    filename='signal_service.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="VertData Signal Generator", version="1.0.0")

GAMMA_API = "https://gamma-api.polymarket.com"
MIN_PRICE = float(os.getenv("MIN_PRICE", "0.05"))
MAX_PRICE = float(os.getenv("MAX_PRICE", "0.95"))
MIN_EDGE = float(os.getenv("MIN_EDGE", "6.5"))
MIN_VOLUME_24H = float(os.getenv("MIN_VOLUME_24H", "5000"))


def generate_run_id() -> str:
    """Generate a random 8-character run ID"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))


def score_market(market: dict) -> dict:
    """Score a market on 4 dimensions, return composite edge."""
    
    volume_24h = float(market.get("volume24hr", 0))
    best_bid = float(market.get("bestBid", 0))
    best_ask = float(market.get("bestAsk", 1))
    spread = best_ask - best_bid
    liquidity = float(market.get("liquidity", 0))
    
    # Liquidity score (1-10): based on 24hr volume
    if volume_24h >= 50000:
        liq_score = 10
    elif volume_24h >= 20000:
        liq_score = 8
    elif volume_24h >= 10000:
        liq_score = 7
    elif volume_24h >= 5000:
        liq_score = 5
    else:
        liq_score = 3
    
    # Spread efficiency (proxy for information edge): tight spread = more efficient
    if spread < 0.02:
        info_score = 8
    elif spread < 0.05:
        info_score = 7
    elif spread < 0.10:
        info_score = 6
    elif spread < 0.20:
        info_score = 4
    else:
        info_score = 2
    
    # Mid-price positioning (sentiment drift proxy)
    mid = (best_bid + best_ask) / 2 if (best_bid + best_ask) > 0 else 0.5
    # Markets near 0.3-0.45 or 0.55-0.70 have more drift potential
    if 0.25 <= mid <= 0.45 or 0.55 <= mid <= 0.75:
        sentiment_score = 7
    elif 0.45 < mid < 0.55:
        sentiment_score = 5  # too uncertain
    else:
        sentiment_score = 4  # too certain
    
    # Confidence: based on liquidity depth
    if liquidity >= 100000:
        conf_score = 8
    elif liquidity >= 50000:
        conf_score = 7
    elif liquidity >= 20000:
        conf_score = 6
    else:
        conf_score = 4
    
    composite = round((liq_score + info_score + sentiment_score + conf_score) / 4, 2)
    
    # Determine side: if mid < 0.5, market leans NO (buy YES for value), else buy NO
    mid_price = (best_bid + best_ask) / 2 if (best_bid + best_ask) > 0 else 0.5
    if mid_price < 0.45:
        side = "BUY"
        outcome = "YES"
        recommended_price = round(min(best_ask + 0.01, 0.95), 3)
    else:
        side = "BUY"
        outcome = "NO"
        recommended_price = round(min(1 - best_bid + 0.01, 0.95), 3)
    
    return {
        "composite_edge": composite,
        "side": side,
        "outcome": outcome,
        "recommended_price": recommended_price,
        "scores": {
            "liquidity": liq_score,
            "information": info_score,
            "sentiment": sentiment_score,
            "confidence": conf_score
        }
    }


def generate_rationale(market: dict, score_data: dict) -> str:
    """Generate a human-readable rationale for the signal"""
    scores = score_data["scores"]
    composite = score_data["composite_edge"]
    
    rationale_parts = []
    
    if scores["liquidity"] >= 8:
        rationale_parts.append("Strong liquidity")
    elif scores["liquidity"] >= 6:
        rationale_parts.append("Moderate liquidity")
    
    if scores["information"] >= 7:
        rationale_parts.append("tight spread indicates institutional participation")
    
    if scores["sentiment"] >= 6:
        rationale_parts.append(f"Price at {score_data['recommended_price']} shows room for movement")
    
    if not rationale_parts:
        rationale_parts.append("Market conditions favor entry")
    
    return ". ".join(rationale_parts) + "."


def calculate_position_size(composite_edge: float) -> int:
    """Calculate position size percentage based on composite edge"""
    if composite_edge >= 8.5:
        return 10
    elif composite_edge >= 7.5:
        return 5
    else:
        return 2


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"ok": True, "version": "1.0.0"}


@app.get("/markets")
async def get_markets():
    """Fetch raw top 50 markets from Gamma API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{GAMMA_API}/markets")
            response.raise_for_status()
            markets = response.json()
            
            # Sort by 24hr volume and take top 50
            sorted_markets = sorted(
                markets,
                key=lambda x: float(x.get("volume24hr", 0)),
                reverse=True
            )[:50]
            
            logging.info(f"Fetched {len(sorted_markets)} markets from Gamma API")
            return {"markets": sorted_markets, "count": len(sorted_markets)}
    
    except httpx.RequestError as e:
        logging.error(f"Gamma API request failed: {e}")
        raise HTTPException(status_code=503, detail="Polymarket API unavailable")
    except Exception as e:
        logging.error(f"Unexpected error fetching markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market/{condition_id}")
async def get_market(condition_id: str):
    """Get single market details with score"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{GAMMA_API}/markets/{condition_id}")
            response.raise_for_status()
            market = response.json()
            
            # Score the market
            score_data = score_market(market)
            
            result = {
                "market_question": market.get("question", "Unknown"),
                "condition_id": market.get("conditionId", condition_id),
                "token_id": market.get("tokens", [{}])[0].get("tokenId", ""),
                "side": score_data["side"],
                "outcome": score_data["outcome"],
                "recommended_price": score_data["recommended_price"],
                "composite_edge": score_data["composite_edge"],
                "position_size_pct": calculate_position_size(score_data["composite_edge"]),
                "scores": score_data["scores"],
                "volume_24h": float(market.get("volume24hr", 0)),
                "best_bid": float(market.get("bestBid", 0)),
                "best_ask": float(market.get("bestAsk", 1))
            }
            
            logging.info(f"Scored market {condition_id}: edge={score_data['composite_edge']}")
            return result
    
    except httpx.RequestError as e:
        logging.error(f"Gamma API request failed for {condition_id}: {e}")
        raise HTTPException(status_code=503, detail="Polymarket API unavailable")
    except Exception as e:
        logging.error(f"Unexpected error fetching market {condition_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze")
async def analyze():
    """Full market analysis pipeline"""
    try:
        run_id = generate_run_id()
        timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        
        logging.info(f"Starting analysis run {run_id}")
        
        # Fetch top 50 markets
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{GAMMA_API}/markets")
            response.raise_for_status()
            all_markets = response.json()
        
        # Sort by 24hr volume and take top 50
        sorted_markets = sorted(
            all_markets,
            key=lambda x: float(x.get("volume24hr", 0)),
            reverse=True
        )[:50]
        
        markets_reviewed = len(sorted_markets)
        logging.info(f"Run {run_id}: Reviewing {markets_reviewed} markets")
        
        # Filter by price and volume
        filtered_markets = []
        for market in sorted_markets:
            volume_24h = float(market.get("volume24hr", 0))
            best_bid = float(market.get("bestBid", 0))
            best_ask = float(market.get("bestAsk", 1))
            mid_price = (best_bid + best_ask) / 2 if (best_bid + best_ask) > 0 else 0.5
            
            if (MIN_PRICE <= mid_price <= MAX_PRICE and 
                volume_24h >= MIN_VOLUME_24H):
                filtered_markets.append(market)
        
        logging.info(f"Run {run_id}: {len(filtered_markets)} markets passed initial filters")
        
        # Score each market
        signals = []
        for market in filtered_markets:
            score_data = score_market(market)
            
            # Filter by minimum edge
            if score_data["composite_edge"] >= MIN_EDGE:
                signal = {
                    "market_question": market.get("question", "Unknown"),
                    "condition_id": market.get("conditionId", ""),
                    "token_id": market.get("tokens", [{}])[0].get("tokenId", "") if market.get("tokens") else "",
                    "side": score_data["side"],
                    "outcome": score_data["outcome"],
                    "recommended_price": score_data["recommended_price"],
                    "composite_edge": score_data["composite_edge"],
                    "position_size_pct": calculate_position_size(score_data["composite_edge"]),
                    "scores": score_data["scores"],
                    "rationale": generate_rationale(market, score_data),
                    "volume_24h": float(market.get("volume24hr", 0))
                }
                signals.append(signal)
        
        # Sort by composite edge descending
        signals.sort(key=lambda x: x["composite_edge"], reverse=True)
        
        logging.info(f"Run {run_id}: Generated {len(signals)} signals")
        
        return {
            "timestamp": timestamp,
            "run_id": run_id,
            "markets_reviewed": markets_reviewed,
            "signals": signals
        }
    
    except httpx.RequestError as e:
        logging.error(f"Gamma API request failed during analysis: {e}")
        raise HTTPException(status_code=503, detail="Polymarket API unavailable")
    except Exception as e:
        logging.error(f"Unexpected error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
