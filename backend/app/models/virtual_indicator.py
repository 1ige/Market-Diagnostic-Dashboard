"""
Virtual Indicators - Dynamically generated indicators that don't exist in the database.
Used for integrating external systems (like Sector Projections) into the indicator framework.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime

class VirtualIndicator:
    """
    A virtual indicator that computes its value dynamically from external sources.
    Used to integrate sector projections and other computed metrics into the main indicator system.
    """
    def __init__(
        self,
        code: str,
        name: str,
        description: str,
        compute_fn,  # Function that returns (score, raw_value, state) tuple
        weight: float = 1.0,
    ):
        self.code = code
        self.name = name
        self.description = description
        self.compute_fn = compute_fn
        self.weight = weight
    
    def compute(self) -> Dict[str, Any]:
        """
        Execute the compute function and return indicator format.
        Returns: {code, name, score, raw_value, state, timestamp, description}
        """
        try:
            score, raw_value, state = self.compute_fn()
            return {
                "code": self.code,
                "name": self.name,
                "score": score,
                "raw_value": raw_value,
                "state": state,
                "timestamp": datetime.utcnow().isoformat(),
                "description": self.description,
                "weight": self.weight,
                "is_virtual": True,
            }
        except Exception as e:
            # Return degraded state if computation fails
            return {
                "code": self.code,
                "name": self.name,
                "score": 50.0,
                "raw_value": None,
                "state": "YELLOW",
                "timestamp": datetime.utcnow().isoformat(),
                "description": f"{self.description} (Error: {str(e)})",
                "weight": self.weight,
                "is_virtual": True,
                "error": str(e),
            }
