package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.entity.TraceabilityRecord;
import com.example.myfullstackapp.repository.TraceabilityRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/traceability")
@RequiredArgsConstructor
public class TraceabilityController {

    private final TraceabilityRecordRepository traceabilityRecordRepository;

    @GetMapping
    public ResponseEntity<List<TraceabilityRecord>> getAllRecords() {
        return ResponseEntity.ok(traceabilityRecordRepository.findAll());
    }

    @GetMapping("/{batchCode}")
    public ResponseEntity<TraceabilityRecord> getByBatchCode(@PathVariable String batchCode) {
        return traceabilityRecordRepository.findByBatchCodeIgnoreCase(batchCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
