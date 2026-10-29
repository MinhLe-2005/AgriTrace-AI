package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.entity.RoleName;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.active = true and exists (select r from Role r where r.name = :roleName and r member of u.roles) order by u.id")
    List<User> findActiveUsersWithRoleForUpdate(@Param("roleName") RoleName roleName);
    @Query("select count(distinct u) from User u join u.roles r where u.active = true and r.name = :roleName")
    long countActiveUsersWithRole(@Param("roleName") RoleName roleName);
    @Override @EntityGraph(attributePaths = "roles")
    Optional<User> findById(UUID id);
    @Override @EntityGraph(attributePaths = "roles")
    List<User> findAll();
}
