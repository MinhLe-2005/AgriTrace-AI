package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("select o from Order o where lower(o.userEmail) = lower(:userEmail) order by o.createdAt desc nulls last, o.id desc")
    List<Order> findByUserEmailOrderByCreatedAtDesc(@Param("userEmail") String userEmail);

    @Query("select o from Order o order by o.createdAt desc nulls last, o.id desc")
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByOrderCodeIn(List<String> orderCodes);
    List<Order> findByLotCodeIgnoreCaseOrderByCreatedAtAsc(String lotCode);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatusInOrderByCreatedAtDesc(List<String> statuses, Pageable pageable);

    @Query("""
            select o from Order o
            where o.status in :statuses
              and (:isAdmin = true or o.distributorEmail is null or lower(o.distributorEmail) = lower(:actorEmail))
            order by o.createdAt desc
            """)
    Page<Order> findVisibleForDistributor(
            @Param("statuses") List<String> statuses,
            @Param("isAdmin") boolean isAdmin,
            @Param("actorEmail") String actorEmail,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.orderCode in :orderCodes")
    List<Order> findAllByOrderCodeInForUpdate(@Param("orderCodes") List<String> orderCodes);

    @Query("select count(o) > 0 from Order o where lower(o.userEmail) = lower(:userEmail) and lower(o.voucherUsed) like lower(concat('%', :voucherCode, '%')) and o.status <> 'CANCELLED'")
    boolean hasUserUsedVoucher(@Param("userEmail") String userEmail, @Param("voucherCode") String voucherCode);

    @Query("select o.voucherUsed from Order o where lower(o.userEmail) = lower(:userEmail) and o.voucherUsed is not null and o.status <> 'CANCELLED'")
    List<String> findUsedVoucherStringsByUser(@Param("userEmail") String userEmail);

    long countByStatusIgnoreCaseAndDistributorEmailIsNull(String status);

    long countByStatusIgnoreCaseAndDistributorEmailIgnoreCase(String status, String distributorEmail);

    long countByStatusIgnoreCase(String status);
}
