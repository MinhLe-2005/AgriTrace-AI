package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByShipmentCodeIgnoreCase(String shipmentCode);
    List<Shipment> findAllByOrderByCreatedAtDesc();
    List<Shipment> findByStatusOrderByCreatedAtDesc(String status);
    List<Shipment> findByDistributorEmailIgnoreCaseOrderByCreatedAtDesc(String distributorEmail);
    List<Shipment> findByDistributorEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(String distributorEmail, String status);

    /** Legacy safeguard for shipment rows created before Order ownership fields existed. */
    @Query(value = """
            select exists (
                select 1 from agri_shipments s
                where concat(',', coalesce(s.order_codes, ''), ',') like concat('%,', :orderCode, ',%')
            )
            """, nativeQuery = true)
    boolean existsLegacyShipmentForOrderCode(@Param("orderCode") String orderCode);
}
