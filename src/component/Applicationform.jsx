import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import PersonalInfo from './FormSteps/PersonalInfo';
import EducationalBackground from "./FormSteps/EduBackground";
import Eligibility from './FormSteps/Eligibility';
import LearningDevelopment from "./FormSteps/LearningDev";
import Attachment from './FormSteps/Attachment';
import Review from './FormSteps/Review';

const Applicationform = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'PERSONAL INFORMATION' },
    { id: 2, title: 'EDUCATIONAL BACKGROUND' },
    { id: 3, title: 'ELIGIBILITY' },
    { id: 4, title: 'LEARNING DEVELOPMENT' },
    { id: 5, title: 'JOB POSITION' },
    { id: 6, title: 'REVIEW' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfo
            onNext={(formData) => {
              console.log('Personal Info:', formData);
              setCurrentStep(2);
            }}
          />
        );
      case 2:
        return <EducationalBackground />;
      case 3:
        return <Eligibility />;
      case 4:
        return <LearningDevelopment />;
      case 5:
        return <Attachment />;
      case 6:
        return <Review />;
      default:
        return (
          <PersonalInfo
            onNext={(formData) => {
              console.log('Personal Info:', formData);
              setCurrentStep(2);
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-12 px-4 font-['Poppins']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-light text-center mb-12 text-slate-800">
          Application <span className="font-bold text-[#0056b3]">Form</span>
        </h1>

        <div className="flex flex-col md:flex-row justify-start gap-8 items-start">
          {/* LEFT SIDE: Vertical Stepper */}
          <div className="w-full md:w-64 flex-shrink-0 sticky top-32 self-start mt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center justify-end mb-10 relative">
                <span
                  className={`mr-4 text-[10px] md:text-xs font-bold tracking-widest text-right max-w-[150px] ${
                    currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>

                <div className="relative z-10">
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-9 h-9 text-green-500 bg-white rounded-full p-0.5" />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${
                        currentStep === step.id
                          ? 'border-[#0056b3] text-[#0056b3] bg-white shadow-md'
                          : 'border-slate-300 text-slate-400 bg-white'
                      }`}
                    >
                      {step.id}
                    </div>
                  )}
                </div>

                {index !== steps.length - 1 && (
                  <div
                    className={`absolute right-[17px] top-9 w-[1.5px] h-10 -z-0 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* RIGHT SIDE: Form Content */}
          <div className="flex-1 min-h-[500px]">
            <div className="border-l-[1.5px] border-slate-300 pl-10 md:pl-10 h-full">
              <h2 className="text-2xl font-bold text-[#003a78] mb-8 tracking-tight uppercase">
                {steps.find((s) => s.id === currentStep)?.title}
              </h2>

              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="mt-12 flex gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                )}

                {currentStep > 1 && currentStep < 6 && (
                  <button
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="bg-[#0056b3] text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-[#004494] transition-all"
                  >
                    Next Step
                  </button>
                )}

                {currentStep === 6 && (
                  <button className="bg-green-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-green-700 transition-all">
                    Submit Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applicationform;