package com.klef.soa.docker.service;

import java.util.List;

import com.klef.soa.docker.dto.PublicLibraryCardDTO;

public interface PublicLibraryCardService {
    PublicLibraryCardDTO addRecord(PublicLibraryCardDTO libraryCardDTO);
    List<PublicLibraryCardDTO> displayAll();
    PublicLibraryCardDTO getById(Long id);
    PublicLibraryCardDTO updateRecord(Long id, PublicLibraryCardDTO libraryCardDTO);
    String deleteById(Long id);
}
