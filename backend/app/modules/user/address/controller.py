from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import AddressService
from app.shared.response import success_response, error_response
from app.shared.exceptions import AppError

address_bp = Blueprint('address', __name__)

@address_bp.route('', methods=['GET'])
@jwt_required()
def get_addresses():
    try:
        user_id = int(get_jwt_identity())
        addresses = AddressService.get_user_addresses(user_id)
        return success_response("Addresses fetched", {"addresses": addresses})
    except Exception as e:
        return error_response(str(e), 500)

@address_bp.route('', methods=['POST'])
@jwt_required()
def add_address():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        result = AddressService.add_address(user_id, data)
        return success_response("Address added", result, 201)
    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), 500)

@address_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_address(id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        result = AddressService.update_address(user_id, id, data)
        return success_response("Address updated", result)
    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), 500)

@address_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_address(id):
    try:
        user_id = int(get_jwt_identity())
        AddressService.delete_address(user_id, id)
        return success_response("Address deleted successfully")
    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response(str(e), 500)