"""
Sector Alerts API Endpoint

Generates real-time alerts when sector leadership patterns diverge from expected market regime behavior.
These divergences can signal regime transitions, recovery opportunities, or early warning signs.

Alert Logic:
- RED market + cyclical leaders → Recovery signal (investors positioning for rebound)
- RED market + extreme defensive bias → Flight to safety (panic positioning)
- GREEN market + defensive leaders → Caution signal (smart money de-risking)
- GREEN market + strong cyclical bias → Risk-on confirmation (healthy environment)
- YELLOW market + extreme bias → Regime transition (potential state change)

Returns:
- count: Number of active alerts
- alerts: Array of alert objects with type, severity, title, message, and supporting data
"""

from fastapi import APIRouter
from app.services.sector_alerts import check_sector_divergence_alerts

router = APIRouter()


@router.get("/sectors/alerts")
def get_sector_alerts():
    """
    Get current sector divergence alerts.
    Returns active alerts when sector leadership diverges from expected market regime patterns.
    """
    alerts = check_sector_divergence_alerts()
    return {
        "count": len(alerts),
        "alerts": alerts,
    }
