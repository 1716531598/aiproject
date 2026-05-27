from flask import jsonify


def success(data=None, msg="操作成功", msg_type="success"):
    return jsonify({"code": 200, "success": True, "data": data or {}, "msg": msg, "msgType": msg_type})


def error(msg="操作失败", code=400, data=None, msg_type="error"):
    return jsonify({"code": code, "success": False, "data": data or {}, "msg": msg, "msgType": msg_type}), 200


def paginate(data_list, page, page_size, total):
    return {"aaData": data_list, "page": page, "pageSize": page_size, "total": total}
