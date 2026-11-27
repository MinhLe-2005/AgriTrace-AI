package com.example.myfullstackapp.config;

import com.example.myfullstackapp.security.CustomUserDetailsService;
import com.example.myfullstackapp.security.JwtTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/** Authenticates STOMP CONNECT because browser WebSocket APIs cannot set HTTP Authorization headers. */
@Component
@RequiredArgsConstructor
public class DistributorStompAuthenticationInterceptor implements ChannelInterceptor {
    private final JwtTokenService jwtTokenService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) return message;
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                String email = jwtTokenService.parse(token).getSubject();
                UserDetails user = userDetailsService.loadUserByUsername(email);
                if (user.isEnabled() && user.isAccountNonLocked() && jwtTokenService.isValidAccessToken(token, user.getUsername())) {
                    accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
                }
            } catch (RuntimeException ignored) {
                // Ignore token error for public / order topics
            }
        }
        return message;
    }
}
