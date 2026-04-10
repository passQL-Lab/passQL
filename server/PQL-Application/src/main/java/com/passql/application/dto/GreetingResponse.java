package com.passql.application.dto;

import com.passql.application.constant.GreetingMessageType;

public record GreetingResponse(
        String nickname,
        String message,
        GreetingMessageType messageType
) {}
