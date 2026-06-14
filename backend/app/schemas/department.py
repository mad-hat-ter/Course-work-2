from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    title: str


class DepartmentCreate(DepartmentBase):
    pass


class Department(DepartmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PositionBase(BaseModel):
    title: str
    department_id: int


class PositionCreate(PositionBase):
    pass


class Position(PositionBase):
    id: int
    department: Department
    model_config = ConfigDict(from_attributes=True)
