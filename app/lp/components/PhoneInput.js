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
          flex-wrap: nowrap;
          min-width: 0;
          background-color: #0D0D0D;
          border: 1px solid #27272A;
          border-radius: 100px;
          overflow: hidden;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountry {
          padding: 16px;
          padding-right: 8px;
          background-color: #0D0D0D;
          border: none;
          border-radius: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountryIcon {
          width: 24px;
          height: 18px;
          border-radius: 2px;
          overflow: hidden;
          background: transparent;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountryIcon--border {
          background-color: transparent;
          box-shadow: none;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountryIconImg {
          display: block;
        }
        
        .lp-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #71717A;
          margin-left: 4px;
        }
        
        .lp-phone-input-wrapper .PhoneInputInput {
          flex: 1;
          padding: 16px 24px;
          padding-left: 8px;
          background-color: #0D0D0D;
          border: none;
          border-radius: 0;
          color: #FFFFFF;
          font-size: 16px;
          font-family: inherit;
          outline: none;
          min-width: 0;
        }
        
        .lp-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #71717A;
        }
        
        .lp-phone-input-wrapper:focus-within .lp-phone-input {
          border-color: #00E08F;
        }
        
        .lp-phone-input-wrapper.error .lp-phone-input {
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
