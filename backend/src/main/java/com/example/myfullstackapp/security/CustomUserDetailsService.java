package com.example.myfullstackapp.security;

import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) {
        String clean = identifier != null ? identifier.trim() : "";
        return userRepository.findByEmailIgnoreCase(clean)
                .or(() -> {
                    if (!clean.contains("@")) {
                        var matches = userRepository.findByIdentifier(clean);
                        return matches.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(matches.get(0));
                    }
                    return java.util.Optional.empty();
                })
                .map(AppUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));
    }
}
