import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const float = keyframes`
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50%       { transform: rotate(45deg) translateY(-6px); }
`


export const Page = styled.div`
  width: 100%;
  overflow-x: hidden;
  background: #0a0a0f;
`


export const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 768px) {
    padding: 12px 20px;
  }
`

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`

export const LogoIcon = styled.span`
  font-size: 24px;
  color: #a855f7;
`

export const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #e2e8f0, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;

  a {
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #ffffff;
    }
  }

  @media (max-width: 768px) {
    gap: 16px;

    a:not(:last-child) {
      display: none;
    }
  }
`

export const NavCta = styled.a`
  padding: 8px 20px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #ffffff !important;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s !important;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
  }
`

export const Hero = styled.section`
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(10, 10, 15, 0.92) 0%,
    rgba(10, 10, 15, 0.6) 40%,
    rgba(124, 58, 237, 0.15) 80%,
    rgba(10, 10, 15, 0.4) 100%
  );
`

export const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  padding: 0 24px;
  animation: ${fadeIn} 0.8s ease-out;
`

export const Badge = styled.span`
  display: inline-block;
  padding: 6px 16px;
  border-radius: 9999px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: #a78bfa;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 24px;
`

export const HeroTitle = styled.h1`
  font-size: 64px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -2px;
  color: #ffffff;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 36px;
    letter-spacing: -1px;
  }

  @media (max-width: 480px) {
    font-size: 28px;
  }
`

export const GradientText = styled.span`
  background: linear-gradient(135deg, #a855f7, #ec4899, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

export const HeroSubtitle = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: #94a3b8;
  max-width: 600px;
  margin: 0 auto 32px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`

export const HeroButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`

export const PrimaryBtn = styled.a`
  display: inline-block;
  padding: 14px 32px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
  }
`

export const SecondaryBtn = styled.a`
  display: inline-block;
  padding: 14px 32px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }
`

export const HeroStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 48px;

  @media (max-width: 768px) {
    gap: 24px;
    flex-wrap: wrap;
  }
`

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`

export const StatNumber = styled.span`
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -1px;
`

export const StatLabel = styled.span`
  font-size: 13px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
`

export const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.6;
`

export const ScrollArrow = styled.div`
  width: 20px;
  height: 20px;
  border-right: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  animation: ${float} 2s ease-in-out infinite;
`

export const SectionHeader = styled.div`
  text-align: center;
  max-width: 640px;
  margin: 0 auto 64px;
`

export const SectionBadge = styled.span`
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  color: #a78bfa;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 16px;
`

export const SectionTitle = styled.h2`
  font-size: 40px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1.5px;
  color: #ffffff;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`

export const SectionDesc = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #94a3b8;
`

export const FeaturesSection = styled.section`
  padding: 120px 48px 80px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 80px 20px;
  }
`

export const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const FeatureCard = styled.div`
  padding: 32px 28px;
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(124, 58, 237, 0.3);
    box-shadow: 0 12px 40px rgba(124, 58, 237, 0.1);
  }
`

export const FeatureIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(168, 85, 247, 0.1));
  color: #a78bfa;
  margin-bottom: 20px;
`

export const FeatureTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10px;
`

export const FeatureDesc = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
`

export const HowItWorksSection = styled.section`
  padding: 80px 48px 120px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 80px 20px;
  }
`

export const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  position: relative;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const StepCard = styled.div`
  text-align: center;
  padding: 32px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  transition: transform 0.3s, border-color 0.3s;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(124, 58, 237, 0.3);
  }
`

export const StepNumber = styled.div`
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
`

export const StepTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
`

export const StepDesc = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
`

export const CtaSection = styled.section`
  padding: 120px 48px;
  background: linear-gradient(180deg, rgba(124, 58, 237, 0.05) 0%, transparent 100%);

  @media (max-width: 768px) {
    padding: 80px 20px;
  }
`

export const CtaContent = styled.div`
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
`

export const CtaTitle = styled.h2`
  font-size: 44px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1.5px;
  color: #ffffff;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`

export const CtaDesc = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #94a3b8;
  margin-bottom: 32px;
`

export const CtaButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`

export const CtaFootnote = styled.p`
  margin-top: 16px;
  font-size: 13px;
  color: #64748b;
`

export const Footer = styled.footer`
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 64px 48px 0;
`

export const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 64px;
  padding-bottom: 48px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 40px;
  }
`

export const FooterBrand = styled.div`
  max-width: 240px;
`

export const FooterLogoText = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-left: 8px;
`

export const FooterDesc = styled.p`
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #64748b;
`

export const FooterLinks = styled.div`
  display: flex;
  gap: 64px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 32px;
  }
`

export const FooterCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  h4 {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  a {
    font-size: 14px;
    color: #64748b;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #ffffff;
    }
  }
`

export const FooterBottom = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 24px 0;
  text-align: center;

  p {
    font-size: 13px;
    color: #475569;
  }
`
