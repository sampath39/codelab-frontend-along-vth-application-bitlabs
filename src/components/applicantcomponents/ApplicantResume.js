import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useUserContext } from '../common/UserProvider';
import MyResumeComponent from './MyResumeComponent';
import EditAndDownloadComponent from './EditAndDownloadComponent';

const ApplicantResume = () => {
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const user = useUserContext().user;
 
  useEffect(() => {
    fetchApplicantDetails();
  }, []);
 
  const fetchApplicantDetails = async () => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const response = await apiClient.get(`/applicant/getApplicantById/${user.id}`);
      setShowBanner(response.data.localResume);
      fetchResumeContent();
    } catch (error) {
      console.error('Error fetching applicant details:', error);
    }
  };
 
  const fetchResumeContent = async () => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const response = await apiClient.get(`/applicant-pdf/getresume/${user.id}`);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resume content:', error);
    }
  };
 
  return (
     <div className="border-style">

        <div className="blur-border-style"></div>
    <div className="dashboard__content">
    <section className="page-title-dashboard">
      <div className="themes-container">
        <div className="row">
          <div className="col-lg-12 col-md-12">
            <div className="title-dashboard">
              <div className="title-dash">My Resume</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div className="col-lg-12 col-md-12">
              <section className="flat-dashboard-setting flat-dashboard-setting2">
                <div className="themes-container">
                  <div className="content-tab">
                    <div className="inner">
                      <div className="group-col-2"></div>
      {showBanner ? (
        <MyResumeComponent pdfUrl={pdfUrl} loading={loading} />
      ) : (
        <EditAndDownloadComponent pdfUrl={pdfUrl} loading={loading} />
      )}
    </div>
    </div>
    </div>
    </section>
    </div>
    </div>
    </div>
  );
};
 
export default ApplicantResume;