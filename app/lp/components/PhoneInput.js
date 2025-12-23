'use client'

import PhoneInputLib from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

/**
 * Componente de input de telefone com bandeiras de países
 * Estilizado para tema escuro das landing pages
 */
export default function PhoneInput({
    value,
    onChange,
    placeholder = 'Seu WhatsApp',
    disabled = false,
    className = '',
    error = false
}) {
    return (
        <div className={`lp-phone-input-wrapper ${error ? 'error' : ''} ${className}`}>
            <PhoneInputLib
                international
                defaultCountry="BR"
                countryCallingCodeEditable={false}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="lp-phone-input"
            />

            <style jsx global>{`
        .lp-phone-input-wrapper {
          width: 100%;
        }
        
        .lp-phone-input-wrapper .lp-phone-input {
          display: flex;
          width: 100%;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountry {
          padding: 16px;
          padding-right: 12px;
          background-color: #0D0D0D;
          border: 1px solid #27272A;
          border-right: none;
          border-radius: 100px 0 0 100px;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountryIcon {
          width: 24px;
          height: 18px;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #71717A;
          margin-left: 8px;
        }
        
        .lp-phone-input-wrapper .PhoneInputInput {
          flex: 1;
          padding: 16px 24px;
          padding-left: 12px;
          background-color: #0D0D0D;
          border: 1px solid #27272A;
          border-left: none;
          border-radius: 0 100px 100px 0;
          color: #FFFFFF;
          font-size: 16px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .lp-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #71717A;
        }
        
        .lp-phone-input-wrapper .PhoneInputInput:focus {
          border-color: #00E08F;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountry:has(+ .PhoneInputInput:focus) {
          border-color: #00E08F;
        }
        
        .lp-phone-input-wrapper.error .PhoneInputInput,
        .lp-phone-input-wrapper.error .PhoneInputCountry {
          border-color: #EF4444;
        }
        
        /* Country select dropdown */
        .lp-phone-input-wrapper .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          z-index: 1;
          border: 0;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
        </div>
    )
}
