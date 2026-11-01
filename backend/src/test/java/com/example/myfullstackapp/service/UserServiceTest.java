package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.user.UserUpdateRequest;
import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.mapper.UserMapper;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class UserServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final RoleRepository roles = mock(RoleRepository.class);
    private final UserMapper mapper = mock(UserMapper.class);
    private final UserService service = new UserService(users, roles, mock(PasswordEncoder.class), mapper);

    @Test
    void preventsAdminFromRemovingOwnAdminRole() {
        UUID adminId = UUID.randomUUID();
        when(users.findById(adminId)).thenReturn(Optional.of(user(adminId, true, RoleName.ADMIN)));

        assertThrows(ConflictException.class, () -> service.update(
                adminId, update(false, RoleName.USER), adminId));

        verify(users, never()).countActiveUsersWithRole(RoleName.ADMIN);
        verify(roles, never()).findByNameIn(anySet());
    }

    @Test
    void preventsDemotingTheLastActiveAdmin() {
        UUID targetId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        when(users.findById(targetId)).thenReturn(Optional.of(user(targetId, true, RoleName.ADMIN)));
        when(users.findActiveUsersWithRoleForUpdate(RoleName.ADMIN)).thenReturn(List.of());
        when(users.countActiveUsersWithRole(RoleName.ADMIN)).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.update(
                targetId, update(true, RoleName.USER), actorId));

        verify(roles, never()).findByNameIn(anySet());
    }

    @Test
    void preventsDeletingTheLastActiveAdmin() {
        UUID targetId = UUID.randomUUID();
        when(users.findById(targetId)).thenReturn(Optional.of(user(targetId, true, RoleName.ADMIN)));
        when(users.findActiveUsersWithRoleForUpdate(RoleName.ADMIN)).thenReturn(List.of());
        when(users.countActiveUsersWithRole(RoleName.ADMIN)).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.delete(targetId, UUID.randomUUID()));

        verify(users, never()).delete(any(User.class));
    }

    @Test
    void preventsAdminFromDeletingOwnAccount() {
        UUID adminId = UUID.randomUUID();

        assertThrows(ConflictException.class, () -> service.delete(adminId, adminId));

        verify(users, never()).findById(any());
        verify(users, never()).delete(any(User.class));
    }

    @Test
    void allowsDemotingAdminWhenAnotherActiveAdminExists() {
        UUID targetId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        Role userRole = Role.builder().id(1L).name(RoleName.USER).build();
        when(users.findById(targetId)).thenReturn(Optional.of(user(targetId, true, RoleName.ADMIN)));
        when(users.findActiveUsersWithRoleForUpdate(RoleName.ADMIN)).thenReturn(List.of());
        when(users.countActiveUsersWithRole(RoleName.ADMIN)).thenReturn(2L);
        when(roles.findByNameIn(Set.of(RoleName.USER))).thenReturn(List.of(userRole));

        service.update(targetId, update(true, RoleName.USER), actorId);

        verify(users).countActiveUsersWithRole(RoleName.ADMIN);
        verify(users).findActiveUsersWithRoleForUpdate(RoleName.ADMIN);
        verify(mapper).toResponse(argThat(updated -> updated.getRoles().contains(userRole)));
    }

    private UserUpdateRequest update(boolean active, RoleName role) {
        return new UserUpdateRequest("Admin", active, Set.of(role));
    }

    private User user(UUID id, boolean active, RoleName role) {
        return User.builder()
                .id(id)
                .email("admin@example.com")
                .fullName("Admin")
                .passwordHash("hash")
                .active(active)
                .roles(Set.of(Role.builder().id(1L).name(role).build()))
                .build();
    }
}
