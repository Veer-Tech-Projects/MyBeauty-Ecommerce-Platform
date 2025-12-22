import secrets
import hashlib

import firebase_admin.auth as firebase_auth
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from typing import Tuple, Dict, Any
from pydantic import ValidationError as PydanticValidationError # <--- 1. NEW IMPORT

from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import LoginSchema, RegisterSchema, GoogleLoginSchema, ForgotPasswordSchema, ResetPasswordSchema

from app.shared.exceptions import AuthError, ValidationError

from app.shared.redis_client import RedisClient
from app.jobs.email_tasks import send_reset_password_email

class AuthService:
    
    # --- Helper to clean messy Pydantic errors ---
    @staticmethod
    def _handle_pydantic_error(e: PydanticValidationError):
        # Extract the first error message
        try:
            error = e.errors()[0]
            msg = error.get('msg', 'Invalid input')
            # Remove Pydantic's automatic "Value error, " prefix if present
            if msg.startswith('Value error, '):
                msg = msg.replace('Value error, ', '')
            raise ValidationError(msg)
        except (IndexError, KeyError):
            raise ValidationError("Invalid input format")

    @staticmethod
    def _sanitize_user(user: Dict) -> Dict:
        """Removes sensitive data before sending to frontend."""
        if not user:
            return None
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user.get("email"),
            "phone": user.get("phone"),
            "profile_pic": user.get("profile_pic"),
            "is_phone_verified": user.get("is_phone_verified", 0)
        }

    @staticmethod
    def _generate_tokens(user_id: int) -> Tuple[str, str]:
        identity = str(user_id)
        access_token = create_access_token(identity=identity)
        refresh_token = create_refresh_token(identity=identity)
        return access_token, refresh_token

    @staticmethod
    def login(data: dict) -> Dict[str, Any]:
        try:
            valid_data = LoginSchema(**data)
        except PydanticValidationError as e: # <--- Catch specific error
            AuthService._handle_pydantic_error(e)
        except Exception as e:
            raise ValidationError(str(e))

        user = UserRepository.get_by_phone(valid_data.phone)
        if not user or not user.get('password_hash'):
            raise AuthError("Invalid credentials")

        if not check_password_hash(user['password_hash'], valid_data.password):
            raise AuthError("Invalid credentials")

        access_token, refresh_token = AuthService._generate_tokens(user['id'])
        
        return {
            "user": AuthService._sanitize_user(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def register(data: dict, file_filename: str = None) -> Dict[str, Any]:
        try:
            valid_data = RegisterSchema(**data)
        except PydanticValidationError as e: # <--- Catch specific error
            AuthService._handle_pydantic_error(e)
        except Exception as e:
            raise ValidationError(str(e))

        if UserRepository.get_by_phone(valid_data.phone):
            raise AuthError("Phone number already registered")
        
        if valid_data.email and UserRepository.get_by_email(valid_data.email):
            raise AuthError("Email already registered")

        pwd_hash = generate_password_hash(valid_data.password)

        user_id = UserRepository.create_user(
            username=valid_data.username,
            phone=valid_data.phone,
            password_hash=pwd_hash,
            email=valid_data.email,
            profile_pic=file_filename
        )

        user = UserRepository.get_by_id(user_id)
        access_token, refresh_token = AuthService._generate_tokens(user_id)

        return {
            "user": AuthService._sanitize_user(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def google_login(data: dict) -> Dict[str, Any]:
        try:
            valid_data = GoogleLoginSchema(**data)
            decoded_token = firebase_auth.verify_id_token(valid_data.id_token)
            google_id = decoded_token['uid']
            email = decoded_token.get('email')
            name = decoded_token.get('name', 'Google User')
            picture = decoded_token.get('picture')
        except Exception as e:
            raise AuthError(f"Invalid Google Token: {str(e)}")

        user = UserRepository.get_by_google_id(google_id)
        
        if not user and email:
            user = UserRepository.get_by_email(email)
            if user:
                UserRepository.update_profile(user['id'], {'google_id': google_id})

        if not user:
            user_id = UserRepository.create_user(
                username=name,
                email=email,
                phone=None,
                google_id=google_id,
                profile_pic=picture
            )
            user = UserRepository.get_by_id(user_id)

        access_token, refresh_token = AuthService._generate_tokens(user['id'])

        return {
            "user": AuthService._sanitize_user(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    
    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def forgot_password(data: dict, ip_address: str):
        try:
            valid_data = ForgotPasswordSchema(**data)
        except PydanticValidationError as e: # <--- Catch specific error
            AuthService._handle_pydantic_error(e)
        except Exception as e:
            raise ValidationError(str(e))

        redis = RedisClient.get_client()
        rate_key = f"rate_limit:fp:{ip_address}"
        
        current_attempts = redis.incr(rate_key)
        if current_attempts == 1:
            redis.expire(rate_key, 3600)
            
        if current_attempts > 5:
            return True 

        user = UserRepository.get_by_email(valid_data.email)
        
        if user:
            active_key = f"pwd_reset_active:{user['id']}"
            old_token_hash = redis.get(active_key)
            
            if old_token_hash:
                redis.delete(f"pwd_reset:{old_token_hash}")

            raw_token = secrets.token_urlsafe(32)
            token_hash = AuthService._hash_token(raw_token)
            
            redis.setex(f"pwd_reset:{token_hash}", 900, user['id'])
            redis.setex(active_key, 900, token_hash)

            send_reset_password_email.delay(user['email'], raw_token)

        return True

    @staticmethod
    def reset_password(data: dict):
        try:
            valid_data = ResetPasswordSchema(**data)
        except PydanticValidationError as e: # <--- Catch specific error
            AuthService._handle_pydantic_error(e)
        except Exception as e:
            raise ValidationError(str(e))

        token_hash = AuthService._hash_token(valid_data.token)
        
        redis = RedisClient.get_client()
        user_id = redis.get(f"pwd_reset:{token_hash}")

        if not user_id:
            raise AuthError("Invalid or expired reset link")

        pwd_hash = generate_password_hash(valid_data.new_password)
        UserRepository.update_password(int(user_id), pwd_hash)

        redis.delete(f"pwd_reset:{token_hash}")
        redis.delete(f"pwd_reset_active:{user_id}")
        
        return True