package com.example.myfullstackapp.security;

import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.time.Instant;

@Getter
public class AppUserDetails implements UserDetails {
    private final UUID id;
    private final String email;
    private final String password;
    private final boolean active;
    private final boolean accountNonLocked;
    private final Collection<? extends GrantedAuthority> authorities;

    public AppUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.active = user.isActive();
        this.accountNonLocked = !user.isAdminLocked()
                && !user.isSelfLocked()
                && (user.getLockedUntil() == null || !Instant.now().isBefore(user.getLockedUntil()));
        this.authorities = user.getRoles().stream()
                .map(Role::getName)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .toList();
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return accountNonLocked; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return active; }
}
