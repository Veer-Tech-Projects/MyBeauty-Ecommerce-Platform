import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-page-wrapper d-flex align-items-center min-vh-100 py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            {/* Logo Section */}
            <div className="text-center mb-4">
              <Link to="/" className="d-inline-block text-decoration-none">
                 {/* Replace this text with your <img src="..." /> if you have a logo file */}
                 <h2 className="fw-bold text-primary m-0">MyJewels</h2>
              </Link>
            </div>
            
            {/* Main Card */}
            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
              <Card.Body className="p-4 p-sm-5">
                {(title || subtitle) && (
                  <div className="text-center mb-4">
                    {title && <h3 className="fs-4 fw-bold mb-2">{title}</h3>}
                    {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
                  </div>
                )}
                
                {children}
              </Card.Body>
            </Card>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-muted small">
                &copy; {new Date().getFullYear()} MyJewels. Secure Enterprise Commerce.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AuthLayout;