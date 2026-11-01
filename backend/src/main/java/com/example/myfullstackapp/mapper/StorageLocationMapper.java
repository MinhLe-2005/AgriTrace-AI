package com.example.myfullstackapp.mapper;

import com.example.myfullstackapp.dto.warehouse.StorageLocationResponse;
import com.example.myfullstackapp.entity.StorageLocation;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StorageLocationMapper {
    @Mapping(target = "warehouseId", source = "warehouse.id")
    StorageLocationResponse toResponse(StorageLocation location);
}
