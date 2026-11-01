package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.user.UserCreateRequest;
import com.example.myfullstackapp.dto.user.UserResponse;
import com.example.myfullstackapp.dto.user.UserUpdateRequest;
import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.mapper.UserMapper;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public List<UserResponse> getAll() { return userRepository.findAll().stream().map(userMapper::toResponse).toList(); }

    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) { return userMapper.toResponse(findUser(id)); }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) throw new ConflictException("An account with this email already exists");
        User user = User.builder().email(email).fullName(request.fullName().trim())
                .passwordHash(passwordEncoder.encode(request.password())).roles(resolveRoles(request.roles())).build();
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request, UUID actorId) {
        User user = findUser(id);
        boolean remainsActiveAdmin = request.active() && request.roles().contains(RoleName.ADMIN);
        if (id.equals(actorId) && !remainsActiveAdmin) {
            throw new ConflictException("You cannot deactivate or remove the administrator role from your own account");
        }
        if (isActiveAdmin(user) && !remainsActiveAdmin) {
            ensureAnotherActiveAdminExists();
        }
        user.setFullName(request.fullName().trim());
        user.setActive(request.active());
        user.setRoles(resolveRoles(request.roles()));
        return userMapper.toResponse(user);
    }

    @Transactional
    public void delete(UUID id, UUID actorId) {
        if (id.equals(actorId)) throw new ConflictException("You cannot delete your own account");
        User user = findUser(id);
        if (isActiveAdmin(user)) ensureAnotherActiveAdminExists();
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public User getEntity(UUID id) { return findUser(id); }

    private User findUser(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Set<Role> resolveRoles(Set<RoleName> roleNames) {
        List<Role> roles = roleRepository.findByNameIn(roleNames);
        if (roles.size() != roleNames.size()) throw new ResourceNotFoundException("One or more roles do not exist");
        return Set.copyOf(roles);
    }

    private boolean isActiveAdmin(User user) {
        return user.isActive() && user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ADMIN);
    }

    private void ensureAnotherActiveAdminExists() {
        userRepository.findActiveUsersWithRoleForUpdate(RoleName.ADMIN);
        if (userRepository.countActiveUsersWithRole(RoleName.ADMIN) <= 1) {
            throw new ConflictException("The last active administrator cannot be removed or deactivated");
        }
    }
}
