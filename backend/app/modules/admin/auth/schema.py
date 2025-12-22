from pydantic import BaseModel, Field

class AdminLoginSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, strip_whitespace=True)
    password: str = Field(..., min_length=1) # Length checked by business logic, schema just ensures presence