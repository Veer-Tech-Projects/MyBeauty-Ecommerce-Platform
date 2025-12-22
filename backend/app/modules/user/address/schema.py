from pydantic import BaseModel, Field, validator
from typing import Optional
import re

# Base Schema for Shared Validation
class BaseAddressSchema(BaseModel):
    @validator('phone', 'alternate_phone', check_fields=False)
    def validate_phone(cls, v):
        if v is None: return None
        clean = re.sub(r'\D', '', v)
        if len(clean) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return clean

    @validator('pincode', check_fields=False)
    def validate_pincode(cls, v):
        if v is None: return None
        if not re.match(r'^\d{6}$', v):
            raise ValueError("Pincode must be exactly 6 digits")
        return v

    @validator('type', check_fields=False)
    def validate_type(cls, v):
        if v is None: return None
        if v.lower() not in ['home', 'work']:
            raise ValueError("Type must be 'home' or 'work'")
        return v.lower()

# Schema for Creating Address
class AddressSchema(BaseAddressSchema):
    fullname: str = Field(..., min_length=3, max_length=100)
    phone: str = Field(..., description="10-digit mobile number")
    pincode: str = Field(..., description="6-digit postal code")
    state: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    house: str = Field(..., min_length=1, max_length=255)
    road: str = Field(..., min_length=3, max_length=255)
    landmark: Optional[str] = Field(None, max_length=255)
    alternate_phone: Optional[str] = None
    type: str = Field("home")
    is_default: bool = Field(False)

# Schema for Partial Updates
class AddressUpdateSchema(BaseAddressSchema):
    fullname: Optional[str] = Field(None, min_length=3, max_length=100)
    phone: Optional[str] = None
    pincode: Optional[str] = None
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    house: Optional[str] = Field(None, min_length=1, max_length=255)
    road: Optional[str] = Field(None, min_length=3, max_length=255)
    landmark: Optional[str] = Field(None, max_length=255)
    alternate_phone: Optional[str] = None
    type: Optional[str] = None
    is_default: Optional[bool] = None