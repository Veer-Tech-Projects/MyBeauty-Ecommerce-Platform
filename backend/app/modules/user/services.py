import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

# Reuse existing Auth components to maintain consistency
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UpdateProfileSchema
from app.modules.auth.services import AuthService  # Reusing the sanitizer

from app.shared.exceptions import ValidationError, AppError
from app.shared.config import settings

class UserService:
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

    @staticmethod
    def _allowed_file(filename):
        return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in UserService.ALLOWED_EXTENSIONS

    @staticmethod
    def update_profile(user_id: int, data: dict):
        # 1. Validate Input using Pydantic
        try:
            valid_data = UpdateProfileSchema(**data)
        except Exception as e:
            raise ValidationError(str(e))

        # 2. Filter None values (Pydantic sets missing optional fields to None)
        updates = {k: v for k, v in valid_data.dict().items() if v is not None}
        
        if not updates:
            raise ValidationError("No valid fields to update")

        # 3. Check uniqueness if email is being changed
        if 'email' in updates:
            existing = UserRepository.get_by_email(updates['email'])
            if existing and existing['id'] != user_id:
                raise ValidationError("Email already in use by another account")

        # 4. Update DB via Repository
        UserRepository.update_profile(user_id, updates)
        
        # 5. Return fresh, sanitized user object
        user = UserRepository.get_by_id(user_id)
        return AuthService._sanitize_user(user)

    @staticmethod
    def update_avatar(user_id: int, file):
        # 1. Validate File
        if not file or file.filename == '':
            raise ValidationError("No file selected")
        
        if not UserService._allowed_file(file.filename):
            raise ValidationError("Invalid file type. Allowed: JPG, PNG, WEBP")

        # 2. Secure Filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"u{user_id}_{uuid.uuid4().hex}.{ext}"
        
        # 3. FIX: Calculate Absolute Path to 'app/static/uploads/avatars'
        # This guarantees the file lands inside the static folder
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'avatars')
        
        # Ensure directory exists
        os.makedirs(upload_folder, exist_ok=True)
        
        # 4. Save to the Correct Location
        file_path = os.path.join(upload_folder, unique_filename)
        print(f"DEBUG: Saving avatar to {file_path}") # Debug print
        file.save(file_path)

        # 5. Update DB (Path relative to static/uploads)
        db_path = f"avatars/{unique_filename}"
        UserRepository.update_profile(user_id, {'profile_pic': db_path})

        return AuthService._sanitize_user(UserRepository.get_by_id(user_id))