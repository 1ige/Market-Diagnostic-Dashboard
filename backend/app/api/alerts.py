"""
Alert API Endpoints
"""
from fastapi import APIRouter
from app.services.alert_engine import get_recent_alerts, check_alert_conditions
from app.utils.response_helpers import format_alert

router = APIRouter()


@router.get("/alerts")
def list_alerts(hours: int = 24):
    """Get recent alerts"""
    alerts = get_recent_alerts(hours=hours)
    return [format_alert(alert) for alert in alerts]


@router.post("/alerts/check")
def trigger_alert_check():
    """Manually trigger alert condition check"""
    alert = check_alert_conditions()
    
    if alert:
        return {
            "alert_triggered": True,
            "alert": format_alert(alert)
        }
    
    return {"alert_triggered": False, "message": "No alert conditions met"}
