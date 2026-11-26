package com.example.myfullstackapp.config;

import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Restores the accounts advertised by the local login page. This is deliberately
 * limited to the dev profile and must never be enabled in production.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDemoAccountBootstrap implements ApplicationRunner {
    private static final String DEMO_PASSWORD = "123456";
    private static final List<DemoAccount> DEMO_ACCOUNTS = List.of(
            new DemoAccount("customer", "customer@sportvenue.com", "Lê Quang Minh", RoleName.CUSTOMER),
            new DemoAccount("farmer", "farmer@sportvenue.com", "Lê Quang Minh (Chủ Vườn)", RoleName.FARMER),
            new DemoAccount("warehouse", "warehouse@sportvenue.com", "Lê Quang Minh (Thủ Kho)", RoleName.WAREHOUSE),
            new DemoAccount("distributor", "distributor@sportvenue.com", "Lê Quang Minh (Vận Chuyển)", RoleName.DISTRIBUTOR),
            new DemoAccount("admin", "admin@sportvenue.com", "Lê Quang Minh (Quản Trị Viên)", RoleName.ADMIN)
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (DemoAccount account : DEMO_ACCOUNTS) {
            Role role = roleRepository.findByName(account.role())
                    .orElseThrow(() -> new ResourceNotFoundException("Default " + account.role() + " role is missing"));
            User user = userRepository.findByEmailIgnoreCase(account.email())
                    .orElseGet(() -> User.builder()
                            .email(account.email())
                            .fullName(account.fullName())
                            .build());

            user.setUsername(account.username());
            user.setFullName(account.fullName());
            user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            user.setRoles(new HashSet<>(Set.of(role)));
            user.setActive(true);
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            user.setSelfLocked(false);
            user.setAdminLocked(false);
            user.setLockReason(null);
            userRepository.save(user);
        }
    }

    private record DemoAccount(String username, String email, String fullName, RoleName role) {
    }
}
