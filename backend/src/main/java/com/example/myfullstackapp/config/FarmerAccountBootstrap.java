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
        final String rawPassword = "Farmer123@";

        try {
            Role farmerRole = roleRepository.findByName(RoleName.FARMER)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.FARMER).build()));
            Role userRole = roleRepository.findByName(RoleName.USER)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.USER).build()));

            // Farmer 1: Bác Nguyễn Văn Hùng (Chủ Nông Trại Xanh Đà Lạt & Cao Lãnh)
            bootstrapSingleFarmer("farmer@agritrace.vn", "farmer_hung", "Bác Nguyễn Văn Hùng", "0912345678", rawPassword, farmerRole, userRole);
            bootstrapSingleFarmer("hung.farmer@agritrace.vn", "farmer_hung", "Bác Nguyễn Văn Hùng", "0912345678", rawPassword, farmerRole, userRole);

            // Farmer 2: Nguyễn Thiệu (Chủ Vườn Sinh Thái Mộc Châu)
            bootstrapSingleFarmer("nguyenthieuu052@gmail.com", "farmer_thieu", "Nguyễn Thiệu", "0987654321", rawPassword, farmerRole, userRole);

            log.info("Bootstrapped farmer accounts successfully (farmer@agritrace.vn & nguyenthieuu052@gmail.com) with password Farmer123@");
        } catch (Exception ex) {
            log.warn("Failed to bootstrap farmer accounts: {}", ex.getMessage(), ex);
        }
    }

    private void bootstrapSingleFarmer(String email, String username, String fullName, String phone, String rawPassword, Role farmerRole, Role userRole) {
        String cleanEmail = email.toLowerCase(Locale.ROOT).trim();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail).orElseGet(() -> {
            log.info("Bootstrapping new farmer account: {}", cleanEmail);
            return User.builder()
                    .email(cleanEmail)
                    .username(username)
                    .fullName(fullName)
                    .phone(phone)
                    .active(true)
                    .roles(new HashSet<>())
                    .build();
        });

        user.setActive(true);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFullName(fullName);
        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        }
        user.getRoles().add(farmerRole);
        user.getRoles().add(userRole);
        userRepository.save(user);
    }
}
