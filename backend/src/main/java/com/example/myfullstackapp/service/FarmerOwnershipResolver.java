package com.example.myfullstackapp.service;

import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Resolves multi-tenant ownership IDs for Farmer accounts and verifies resource isolation.
 */
@Service
@RequiredArgsConstructor
public class FarmerOwnershipResolver {

    private static final Set<String> PRIVILEGED_ROLES = Set.of(
            "ROLE_ADMIN", "ROLE_WAREHOUSE", "ROLE_WAREHOUSE_STAFF", "ROLE_DISTRIBUTOR"
    );

    private final UserRepository userRepository;

    public Authentication currentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public boolean isStrictFarmerSession(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        boolean hasFarmer = false;
        boolean hasPrivileged = false;
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String role = authority.getAuthority();
            if ("ROLE_FARMER".equals(role)) {
                hasFarmer = true;
            } else if (PRIVILEGED_ROLES.contains(role)) {
                hasPrivileged = true;
            }
        }
        return hasFarmer && !hasPrivileged;
    }

    public boolean isPrivilegedActor(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(PRIVILEGED_ROLES::contains);
    }

    public Optional<String> resolveAuthenticatedOwnerId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof AppUserDetails details) {
            return Optional.of(mapEmailOrIdToOwnerId(details.getEmail(), details.getId() != null ? details.getId().toString() : null));
        }
        String name = auth.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            return Optional.empty();
        }
        Optional<User> dbUser = userRepository.findByEmailIgnoreCase(name.trim());
        if (dbUser.isPresent()) {
            User user = dbUser.get();
            return Optional.of(mapEmailOrIdToOwnerId(user.getEmail(), user.getId() != null ? user.getId().toString() : null));
        }
        return Optional.of(mapEmailOrIdToOwnerId(name, null));
    }

    public String resolveEffectiveOwnerId(String requestedOwnerId, String farmCodeOrName) {
        Authentication auth = currentAuthentication();
        if (isStrictFarmerSession(auth)) {
            Optional<String> authenticatedOwner = resolveAuthenticatedOwnerId(auth);
            if (authenticatedOwner.isPresent()) {
                return authenticatedOwner.get();
            }
        }
        if (requestedOwnerId != null && !requestedOwnerId.isBlank()) {
            return requestedOwnerId.trim();
        }
        return inferOwnerIdFromFarm(farmCodeOrName);
    }

    public boolean canModifyOwnedResource(String resourceOwnerId) {
        Authentication auth = currentAuthentication();
        if (!isStrictFarmerSession(auth)) {
            return true;
        }
        Optional<String> currentOwnerOpt = resolveAuthenticatedOwnerId(auth);
        if (currentOwnerOpt.isEmpty()) {
            return true;
        }
        String effectiveResourceOwner = resourceOwnerId == null || resourceOwnerId.isBlank()
                ? "farmer_hung"
                : resourceOwnerId.trim();
        return currentOwnerOpt.get().equalsIgnoreCase(effectiveResourceOwner);
    }

    public String mapEmailOrIdToOwnerId(String email, String userId) {
        String lower = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (lower.equals("nguyenthieuu052@gmail.com")
                || lower.equals("farmer_thieu")
                || lower.contains("thieu")) {
            return "farmer_thieu";
        }
        if (lower.equals("farmer@agritrace.vn")
                || lower.equals("hung.farmer@agritrace.vn")
                || lower.equals("farmer@sportvenue.com")
                || lower.equals("farmer_hung")) {
            return "farmer_hung";
        }
        if (userId != null && !userId.isBlank()) {
            return "farmer_" + userId.trim();
        }
        return lower.isBlank() ? "farmer_hung" : lower;
    }

    public String inferOwnerIdFromFarm(String farmCodeOrName) {
        if (farmCodeOrName == null) {
            return "farmer_hung";
        }
        String lower = farmCodeOrName.toLowerCase(Locale.ROOT);
        if (lower.contains("mc") || lower.contains("mộc châu") || lower.contains("thieu") || lower.contains("thiệu")) {
            return "farmer_thieu";
        }
        return "farmer_hung";
    }
}
