from app.core.db import SessionLocal
from app.models.indicator import Indicator

db = SessionLocal()
indicators = db.query(Indicator).order_by(Indicator.code).all()

print("\n" + "="*90)
print("INDICATOR DIRECTION VERIFICATION")
print("="*90)
print(f"\n{'Code':<25} {'Direction':<12} {'Interpretation'}")
print("-"*90)

for ind in indicators:
    interpretation = "High value = STRESS (e.g., high VIX)" if ind.direction == 1 else "High value = GOOD (e.g., positive spread)"
    print(f"{ind.code:<25} {ind.direction:<12} {interpretation}")

print("\n" + "="*90)
print("CURRENT STATUS:")
print("="*90)

from app.models.indicator_value import IndicatorValue
from sqlalchemy import desc

for ind in indicators:
    latest = db.query(IndicatorValue).filter(
        IndicatorValue.indicator_id == ind.id
    ).order_by(desc(IndicatorValue.timestamp)).first()
    
    if latest:
        print(f"\n{ind.name}")
        print(f"  Raw Value: {latest.raw_value:.4f}")
        print(f"  Score: {latest.score:.0f}/100")
        print(f"  State: {latest.state}")

db.close()
