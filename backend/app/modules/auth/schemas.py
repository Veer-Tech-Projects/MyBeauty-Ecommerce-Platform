from pydantic import BaseModel, EmailStr, Field, validator
import re
from typing import Optional

class LoginSchema(BaseModel):
    phone: str = Field(..., description="User phone number")
    password: str = Field(..., min_length=6, description="User password")

    @validator('phone')
    def validate_phone(cls, v):
        # Remove non-digits
        cleaned = re.sub(r'\D', '', v)
        if len(cleaned) < 10:
            raise ValueError('Invalid phone number format')
        # Enterprise Fix: Return the cleaned value, don't just validate it
        return cleaned

class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6)

    @validator('phone')
    def validate_phone(cls, v):
        cleaned = re.sub(r'\D', '', v)
        if len(cleaned) < 10:
            raise ValueError('Invalid phone number format')
        return cleaned

class GoogleLoginSchema(BaseModel):
    id_token: str = Field(..., description="Firebase ID Token")

class UpdateProfileSchema(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

class ForgotPasswordSchema(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")

class ResetPasswordSchema(BaseModel):
    token: str = Field(..., description="The reset token received via email")
    new_password: str = Field(..., min_length=8, description="New strong password")

    @validator('new_password')
    def validate_password_strength(cls, v):
        # 1. Check for at least one number
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        # 2. Check for at least one special character
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v