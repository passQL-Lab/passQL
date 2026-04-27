-- V0_0_95__add_choice_generation_mode_to_member.sql
ALTER TABLE member
    ADD COLUMN choice_generation_mode VARCHAR(20) NOT NULL DEFAULT 'PRACTICE';
