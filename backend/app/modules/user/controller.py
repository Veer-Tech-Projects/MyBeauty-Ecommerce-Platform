from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.modules.user.services import UserService
from app.shared.response import success_response, error_response
from app.shared.exceptions import AppError

# Define the Blueprint
user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update text details (username, email).
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        updated_user = UserService.update_profile(user_id, data)
        
        return success_response("Profile updated successfully", {"user": updated_user})

    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response("Update failed", details=str(e), status_code=500)

@user_bp.route('/avatar', methods=['POST'])
@jwt_required()
def update_avatar():
    """
    Upload a new profile picture.
    Expects multipart/form-data with key 'profile_pic'.
    """
    try:
        user_id = int(get_jwt_identity())
        
        if 'profile_pic' not in request.files:
            return error_response("No file part in request", status_code=400)
            
        file = request.files['profile_pic']
        
        updated_user = UserService.update_avatar(user_id, file)
        
        return success_response("Profile picture updated", {"user": updated_user})

    except AppError as e:
        return error_response(e.message, status_code=e.status_code)
    except Exception as e:
        return error_response("Upload failed", details=str(e), status_code=500)