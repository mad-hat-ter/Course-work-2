from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base
from enum import Enum as PyEnum


class Roles(PyEnum):
    NONE = 'NONE'
    CURATOR = 'CURATOR'
    MANAGER = 'MANAGER'
    ADMINISTRATOR = 'ADMINISTRATOR'

class Department(Base):
    __tablename__ = "department"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    position = relationship("Position", back_populates="department", cascade="all, delete-orphan")

class Position(Base):
    __tablename__ = "position"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    department_id = Column(Integer, ForeignKey('department.id', ondelete="CASCADE"))
    department = relationship("Department", back_populates="position")
    user = relationship("User", back_populates="position", lazy="selectin")

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    surname = Column(String(128), nullable=False)
    lastname = Column(String(128))
    position_id = Column(Integer, ForeignKey('position.id', ondelete="SET NULL"))
    role = Column(Enum(Roles, name='role', create_type=True), nullable=False, default=Roles.NONE)
    email = Column(String(128), nullable=False)
    phone = Column(String(15))
    is_active = Column(Boolean, default=True)
    registration_date = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, nullable=True)
    password = Column(String(128), nullable=False) 
    position = relationship("Position", back_populates="user")
    shift_user = relationship("Shift_user", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    schedule = relationship("Schedule", back_populates="user", lazy="selectin")