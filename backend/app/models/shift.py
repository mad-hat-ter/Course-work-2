from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base


class Schedule(Base):
    __tablename__ = "schedule"
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey('user.id', ondelete="SET NULL"))
    create_date = Column(DateTime, default=datetime.now)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    opening_date = Column(DateTime, default=datetime.now)
    ending_date = Column(DateTime, default=datetime.now)
    user = relationship("User", back_populates="schedule", lazy="selectin")
    shift_schedule = relationship("Shift_schedule", back_populates="schedule", lazy="selectin", cascade="all, delete-orphan")

class Shift_type(Base):
    __tablename__ = "shift_type"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    rate = Column(Float, default=0)
    quantity_for_increased_payment = Column(Integer)
    increased_payment = Column(Float)
    shift = relationship("Shift", back_populates="shift_type", lazy="selectin", cascade="all, delete-orphan")

class Shift(Base):
    __tablename__ = "shift"
    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey('shift_type.id', ondelete="CASCADE"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    is_free = Column(Boolean, default=True)
    max_user = Column(Integer, nullable=False, default=0)
    shift_type = relationship("Shift_type", back_populates="shift")
    shift_user = relationship("Shift_user", back_populates="shift", lazy="selectin", cascade="all, delete-orphan")
    shift_schedule = relationship("Shift_schedule", back_populates="shift", lazy="selectin", cascade="all, delete-orphan")


class Shift_schedule(Base):
    __tablename__ = "shift_schedule"
    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey('shift.id', ondelete="CASCADE"), nullable=True)
    schedule_id = Column(Integer, ForeignKey('schedule.id', ondelete="CASCADE"))
    schedule = relationship("Schedule", back_populates="shift_schedule")
    shift = relationship("Shift", back_populates="shift_schedule")
    __table_args__ = (UniqueConstraint('shift_id', 'schedule_id', name='_shift_schedule_uc'),)

class Shift_user(Base):
    __tablename__ = "shift_user"
    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey('shift.id', ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey('user.id', ondelete="RESTRICT"))
    user = relationship("User", back_populates="shift_user")
    shift = relationship("Shift", back_populates="shift_user")
    __table_args__ = (UniqueConstraint('shift_id', 'user_id', name='_shift_user_uc'),)