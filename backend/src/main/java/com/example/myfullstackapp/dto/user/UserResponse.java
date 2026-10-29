package com.example.myfullstackapp.dto.user;

import com.example.myfullstackapp.entity.RoleName;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserResponse(UUID id, String email, String fullName, String phone, String companyName, String address, boolean active, Set<RoleName> roles,
                           Instant createdAt, Instant updatedAt) { }
