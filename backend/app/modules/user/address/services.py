from .repository import AddressRepository
from .schema import AddressSchema, AddressUpdateSchema
from app.shared.exceptions import ValidationError, AppError

class AddressService:
    
    @staticmethod
    def get_user_addresses(user_id: int):
        return AddressRepository.get_all(user_id)

    @staticmethod
    def add_address(user_id: int, data: dict):
        try:
            valid_data = AddressSchema(**data)
        except Exception as e:
            raise ValidationError(str(e))

        # Repo handles transactions and limit checks
        addr_id = AddressRepository.create(user_id, valid_data.dict())
        return {"id": addr_id, **valid_data.dict()}

    @staticmethod
    def update_address(user_id: int, address_id: int, data: dict):
        try:
            # Validate partial fields
            valid_data = AddressUpdateSchema(**data)
            clean_data = valid_data.dict(exclude_unset=True)
        except Exception as e:
            raise ValidationError(str(e))

        if not clean_data:
            raise ValidationError("No valid fields provided")

        success = AddressRepository.update(user_id, address_id, clean_data)
        if not success:
            raise AppError("Address not found or access denied", 404)
            
        return {"id": address_id, "status": "updated"}

    @staticmethod
    def delete_address(user_id: int, address_id: int):
        success = AddressRepository.delete(user_id, address_id)
        if not success:
            raise AppError("Address not found or access denied", 404)
        return True