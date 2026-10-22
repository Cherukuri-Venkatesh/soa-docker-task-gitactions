package com.klef.soa.docker.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.klef.soa.docker.dto.PublicLibraryCardDTO;
import com.klef.soa.docker.service.PublicLibraryCardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@CrossOrigin(origins = "*")
@Tag(name = "Public Library Card Controller", description = "CRUD APIs for Public Library Card Management")
public class PublicLibraryCardController {

    @Autowired
    private PublicLibraryCardService libraryCardService;

    @GetMapping("/")
    @Operation(summary = "Service Health Check", description = "Root health check endpoint")
    public String home() {
        return "Public Library Card Service Project is running";
    }

    @PostMapping("/add")
    @Operation(summary = "Add Library Card", description = "Creates a new public library card record (auto-generates ID)")
    public ResponseEntity<PublicLibraryCardDTO> addCard(@Valid @RequestBody PublicLibraryCardDTO libraryCardDTO) {
        PublicLibraryCardDTO saved = libraryCardService.addRecord(libraryCardDTO);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping("/displayall")
    @Operation(summary = "Display All Library Cards", description = "Retrieves all public library card records")
    public ResponseEntity<List<PublicLibraryCardDTO>> displayAllCards() {
        List<PublicLibraryCardDTO> cards = libraryCardService.displayAll();
        return ResponseEntity.ok(cards);
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "Get Library Card by ID", description = "Retrieves a single card by its ID")
    public ResponseEntity<?> getCardById(@PathVariable Long id) {
        PublicLibraryCardDTO card = libraryCardService.getById(id);
        if (card != null) {
            return ResponseEntity.ok(card);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Library card with ID " + id + " not found");
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Update Library Card", description = "Updates an existing public library card record")
    public ResponseEntity<?> updateCard(@PathVariable Long id, @Valid @RequestBody PublicLibraryCardDTO libraryCardDTO) {
        PublicLibraryCardDTO updated = libraryCardService.updateRecord(id, libraryCardDTO);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Library card with ID " + id + " not found for update");
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Delete Library Card by ID", description = "Deletes a public library card record by its ID")
    public ResponseEntity<String> deleteCardById(@PathVariable Long id) {
        String result = libraryCardService.deleteById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Library card with ID " + id + " not found");
    }
}
