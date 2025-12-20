from fastapi import APIRouter
from app.models.system_status import SystemStatus
from app.models.indicator import Indicator
from app.models.indicator_value import IndicatorValue
from app.utils.db_helpers import get_db_session
from app.utils.response_helpers import format_system_status, format_indicator_status

router = APIRouter()

@router.get("/system")
def get_system_status():
    with get_db_session() as db:
        status = db.query(SystemStatus).order_by(SystemStatus.timestamp.desc()).first()
        return format_system_status(status)

@router.get("/indicators")
def get_indicator_status():
    with get_db_session() as db:
        indicators = db.query(Indicator).all()
        values = (
            db.query(IndicatorValue)
            .order_by(IndicatorValue.timestamp.desc())
            .all()
        )

        # Build a map of latest values per indicator
        latest = {}
        for v in values:
            if v.indicator_id not in latest:
                latest[v.indicator_id] = v

        # Format each indicator with its latest value
        return [
            format_indicator_status(ind, latest.get(ind.id))
            for ind in indicators
        ]