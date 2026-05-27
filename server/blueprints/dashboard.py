import random
from flask import Blueprint
from utils.response import success
from blueprints.auth import get_current_user
from config import get_config

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/v1/dashboard")


def _mock_chart_data():
    months = [f"{i}月" for i in range(1, 13)]
    sales_data = [{"x": m, "y": random.randint(1000, 10000)} for m in months]

    visit_data = []
    visit_data2 = []
    for i in range(30):
        import datetime
        d = (datetime.datetime.utcnow() - datetime.timedelta(days=29 - i)).strftime("%Y-%m-%d")
        visit_data.append({"x": d, "y": random.randint(100, 1000)})
        visit_data2.append({"x": d, "y": random.randint(50, 500)})

    radar_data = []
    for name in ("个人", "团队"):
        for label in ("引用", "热度", "贡献", "产量", "口碑"):
            radar_data.append({"name": name, "label": label, "value": random.randint(20, 100)})

    return {
        "visitData": visit_data,
        "visitData2": visit_data2,
        "salesData": sales_data,
        "radarData": radar_data,
    }


def _real_chart_data():
    from utils.redis_client import get_redis
    import json

    r = get_redis()
    cached = r.get("cache:dashboard")
    if cached:
        return json.loads(cached)

    from utils.db import SessionLocal
    from models import AuditLog
    from sqlalchemy import func
    import datetime

    db = SessionLocal()
    try:
        # daily login counts for last 30 days
        thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        daily = (
            db.query(func.date(AuditLog.created_at).label("d"), func.count().label("c"))
            .filter(AuditLog.created_at >= thirty_days_ago)
            .group_by(func.date(AuditLog.created_at))
            .all()
        )
        visit_data = [{"x": str(d), "y": c} for d, c in daily]

        # operation type distribution
        types = (
            db.query(AuditLog.type, func.count())
            .group_by(AuditLog.type)
            .all()
        )
        sales_data = [{"x": t, "y": c} for t, c in types]

        # user activity radar
        radar_data = []
        for name, uid in [("个人", 1), ("团队", 2)]:
            for label in ("引用", "热度", "贡献", "产量", "口碑"):
                count = db.query(AuditLog).filter(AuditLog.userid == uid).count()
                radar_data.append({"name": name, "label": label, "value": min(count, 100)})

        result = {
            "visitData": visit_data,
            "visitData2": visit_data,
            "salesData": sales_data,
            "radarData": radar_data,
        }
        r.setex("cache:dashboard", 600, json.dumps(result))
        return result
    finally:
        db.close()


@dashboard_bp.route("/chart-data", methods=["GET"])
def chart_data():
    session = get_current_user()
    if not session:
        from utils.response import error
        return error("未登录", code=401)

    config = get_config()
    if config.DASHBOARD_MODE == "real":
        data = _real_chart_data()
    else:
        data = _mock_chart_data()

    return success(data)
