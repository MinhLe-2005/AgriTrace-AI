package com.example.myfullstackapp.config;

import com.example.myfullstackapp.entity.Role;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.RoleRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;

/**
 * Initializes the requested farmer account (nguyenthieuu052@gmail.com)
 * with role FARMER on application startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FarmerAccountBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        final String email = "nguyenthieuu052@gmail.com".toLowerCase(Locale.ROOT);
        final String rawPassword = "Farmer123@";

        try {
            Role farmerRole = roleRepository.findByName(RoleName.FARMER)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.FARMER).build()));
            Role userRole = roleRepository.findByName(RoleName.USER)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.USER).build()));

            User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                log.info("Bootstrapping new farmer account: {}", email);
                return User.builder()
                        .email(email)
                        .username("nguyenthieuu052")
                        .fullName("Nguyễn Thiệu")
                        .phone("0912345678")
                        .active(true)
                        .roles(new HashSet<>())
                        .build();
            });

            user.setActive(true);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            if (user.getRoles() == null) {
                user.setRoles(new HashSet<>());
            }
            user.getRoles().add(farmerRole);
            user.getRoles().add(userRole);

            userRepository.save(user);
            log.info("Farmer account [{}] initialized successfully with FARMER role!", email);
        } catch (Exception ex) {
            log.warn("Failed to bootstrap farmer account [{}]: {}", email, ex.getMessage(), ex);
        }
    }
}
