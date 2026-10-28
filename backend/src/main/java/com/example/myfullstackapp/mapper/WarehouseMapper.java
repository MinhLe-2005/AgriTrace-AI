package com.example.myfullstackapp.mapper;

import com.example.myfullstackapp.dto.warehouse.WarehouseResponse;
import com.example.myfullstackapp.entity.Warehouse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {
    @Mapping(target = "managerId", source = "manager.id")
    WarehouseResponse toResponse(Warehouse warehouse);
}
