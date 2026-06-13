package com.passql.member.dto;

import com.passql.member.constant.ChoiceGenerationMode;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChoiceGenerationModeUpdateRequest {

    @NotNull
    private ChoiceGenerationMode choiceGenerationMode;
}
