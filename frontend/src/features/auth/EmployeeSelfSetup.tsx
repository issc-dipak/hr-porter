import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, User, Landmark, ShieldCheck, 
  ArrowRight, ArrowLeft, Loader2, Sparkles, Upload, Check, GraduationCap, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmployeeSelfSetupProps {
  token: string;
  onComplete: () => void;
}

export function EmployeeSelfSetup({ token, onComplete }: EmployeeSelfSetupProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Personal Info & Password State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Documents State
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; fileUrl: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3: Bank Details State
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [pennyDropSuccess, setPennyDropSuccess] = useState(false);
  const [isPennyDropping, setIsPennyDropping] = useState(false);

  // Step 4: Professional Details State
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [certifications, setCertifications] = useState('');

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/onboarding/invite/${token}`);
        if (!res.ok) {
          throw new Error('This invitation link is invalid or has expired.');
        }
        const result = await res.json();
        setRequestData(result.data);
        if (result.data) {
          setFullName(result.data.inviteName || '');
          if (result.data.personalInfo) {
            setDob(result.data.personalInfo.dateOfBirth || '');
            setGender(result.data.personalInfo.gender || 'Male');
            setAddress(result.data.personalInfo.address || '');
            setCity(result.data.personalInfo.city || '');
            setState(result.data.personalInfo.state || '');
            setCountry(result.data.personalInfo.country || 'India');
            setEmergencyContactName(result.data.personalInfo.emergencyContactName || '');
            setEmergencyContactNumber(result.data.personalInfo.emergencyContactNumber || '');
          }
          if (result.data.bankDetails) {
            setHolderName(result.data.bankDetails.accountHolderName || result.data.inviteName || '');
            setAccountNumber(result.data.bankDetails.accountNumber || '');
            setIfscCode(result.data.bankDetails.ifscCode || '');
            setBankName(result.data.bankDetails.bankName || '');
            setUpiId(result.data.bankDetails.upiId || '');
            setPennyDropSuccess(result.data.bankDetails.pennyDropVerified || false);
          }
          if (result.data.documents) {
            setUploadedDocs(result.data.documents);
          }
          if (result.data.professionalInfo) {
            setEducation(result.data.professionalInfo.education || '');
            setExperience(result.data.professionalInfo.experience || '');
            setSkills(Array.isArray(result.data.professionalInfo.skills) ? result.data.professionalInfo.skills.join(', ') : (result.data.professionalInfo.skills || ''));
            setLinkedinProfile(result.data.professionalInfo.linkedinProfile || '');
            setCertifications(result.data.professionalInfo.certifications || '');
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInviteDetails();
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/onboarding-upload?requestId=${requestData._id}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('File upload failed');
      const result = await response.json();
      
      const newDoc = { name: docName, fileUrl: result.url };
      setUploadedDocs(prev => {
        const filtered = prev.filter(d => d.name !== docName);
        return [...filtered, newDoc];
      });
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyBank = async () => {
    if (!holderName || !accountNumber || !ifscCode || !bankName) {
      alert('Please fill out all bank credentials first.');
      return;
    }
    setIsPennyDropping(true);
    setTimeout(() => {
      setIsPennyDropping(false);
      setPennyDropSuccess(true);
    }, 1800);
  };

  const handleSaveProfile = async () => {
    if (!fullName || !dob || !address || !city || !state || !country || !emergencyContactName || !emergencyContactNumber || !password) {
      alert('Please fill out all personal details and choose a login password.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/onboarding/${requestData._id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth: dob,
          gender,
          address,
          city,
          state,
          country,
          emergencyContactName,
          emergencyContactNumber,
          password
        })
      });
      if (res.ok) {
        setStep(2);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDocuments = async () => {
    const requiredDocs = ['Passport Photo', 'Aadhaar Card', 'PAN Card'];
    const uploadedNames = uploadedDocs.map(d => d.name);
    const missing = requiredDocs.filter(req => !uploadedNames.includes(req));
    
    if (missing.length > 0) {
      alert(`Please upload required documents: ${missing.join(', ')}`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/onboarding/${requestData._id}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: uploadedDocs })
      });
      if (res.ok) {
        setStep(3);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save documents');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBank = async () => {
    if (!holderName || !accountNumber || !ifscCode || !bankName) {
      alert('Please complete all bank credentials fields.');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/onboarding/${requestData._id}/bank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountHolderName: holderName,
          accountNumber,
          ifscCode,
          bankName,
          upiId,
          pennyDrop: pennyDropSuccess
        })
      });
      if (res.ok) {
        setStep(4);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save bank details');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfessional = async () => {
    if (!education || !experience || !skills) {
      alert('Please fill out your education, experience, and key skills.');
      return;
    }
    try {
      setIsSubmitting(true);
      const skillArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`/api/onboarding/${requestData._id}/professional`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          education,
          experience,
          skills: skillArray,
          linkedinProfile,
          certifications
        })
      });
      if (res.ok) {
        setStep(5);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save professional details');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-3 p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center">Securing Onboarding Portal...</p>
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-md w-full space-y-4">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-white uppercase tracking-tight font-outfit">Invitation Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error || 'This invite token has expired or is invalid.'}</p>
        </div>
      </div>
    );
  }

  const completionPercent = step === 1 ? 0 : step === 2 ? 25 : step === 3 ? 50 : step === 4 ? 75 : 100;

  /* ── Step icons & labels for the stepper ── */
  const steps = [
    { icon: User,          label: 'Personal' },
    { icon: FileText,      label: 'Documents' },
    { icon: Landmark,      label: 'Banking' },
    { icon: GraduationCap, label: 'Professional' },
    { icon: CheckCircle2,  label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-3 sm:p-6 py-6 sm:py-10 text-left font-sans overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-2xl relative">

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 rounded-t-2xl sm:rounded-t-3xl overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
          />
        </div>

        {/* Wizard Header */}
        <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-slate-800/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block">Candidate Onboarding Setup</span>
            <h1 className="text-sm sm:text-base font-black text-white uppercase mt-0.5 tracking-tight font-outfit truncate">
              Welcome, {requestData.inviteName}
            </h1>
          </div>
          <span className="shrink-0 text-[9px] font-black text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl uppercase tracking-wider whitespace-nowrap">
            Step {step}/5
          </span>
        </div>

        {/* Step Indicator */}
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const num = idx + 1;
              const isDone = step > num;
              const isActive = step === num;
              return (
                <React.Fragment key={num}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all",
                      isDone  ? "bg-emerald-500 border-emerald-500 text-white" :
                      isActive ? "bg-blue-600 border-blue-500 text-white" :
                                 "bg-slate-800 border-slate-700 text-slate-500"
                    )}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                    </div>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-wider hidden sm:block",
                      isActive ? "text-blue-400" : isDone ? "text-emerald-400" : "text-slate-600"
                    )}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-1 sm:mx-2 transition-all", step > num ? "bg-emerald-500" : "bg-slate-800")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-4 sm:p-6 min-h-[300px]">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Personal Info ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Step 1: Personal Information &amp; Password</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Enter your identification, address, emergency contact, and set your login password.</p>
                </div>

                {/* Job Info Card */}
                <div className="bg-slate-950 p-3 sm:p-4 border border-slate-800 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <span className="text-slate-400">Position Offered:</span>
                    <span className="font-bold text-white text-right">{requestData.designation} ({requestData.employmentType || 'Full-Time'})</span>
                  </div>
                  <div className="flex justify-between gap-2 flex-wrap">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-bold text-white text-right">{requestData.department}</span>
                  </div>
                  <div className="flex justify-between gap-2 flex-wrap">
                    <span className="text-slate-400">Joining Date:</span>
                    <span className="font-bold text-white text-right">{new Date(requestData.joiningDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Full Name + DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="saas-input w-full p-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Date of Birth *</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="saas-input w-full p-2.5 text-white"
                      />
                    </div>
                  </div>

                  {/* Gender + Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Gender *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="saas-input w-full p-2.5 text-white cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Choose Password *</label>
                      <input
                        type="password"
                        placeholder="Login password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="saas-input w-full p-2.5"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Address *</label>
                    <input
                      type="text"
                      placeholder="Street address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="saas-input w-full p-2.5"
                    />
                  </div>

                  {/* City + State + Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">City *</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">State *</label>
                      <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Country *</label>
                      <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Emergency Contact Name *</label>
                      <input
                        type="text"
                        placeholder="Name of contact..."
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="saas-input w-full p-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Emergency Contact Number *</label>
                      <input
                        type="text"
                        placeholder="Phone number..."
                        value={emergencyContactNumber}
                        onChange={(e) => setEmergencyContactNumber(e.target.value)}
                        className="saas-input w-full p-2.5"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSubmitting}
                  className="saas-btn-primary w-full justify-center text-[10px] mt-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Next Step'} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Documents ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" /> Step 2: Verification Documents Upload
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Upload identity documents, resume, and certificates. Required: Passport Photo, Aadhaar, PAN.</p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                  {['Passport Photo', 'Aadhaar Card', 'PAN Card', 'Resume', 'Education Certificates', 'Experience Certificates'].map(docName => {
                    const uploaded = uploadedDocs.find(d => d.name === docName);
                    const isRequired = ['Passport Photo', 'Aadhaar Card', 'PAN Card'].includes(docName);
                    return (
                      <div key={docName} className="flex items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate">
                            {docName} {isRequired && <span className="text-rose-400">*</span>}
                          </p>
                          {uploaded ? (
                            <a href={uploaded.fileUrl} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 font-bold uppercase tracking-wider hover:underline block mt-0.5">View Uploaded File</a>
                          ) : (
                            <p className="text-[9px] text-slate-500 mt-0.5">Not uploaded yet</p>
                          )}
                        </div>

                        <div className="relative shrink-0">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            id={`file-${docName}`}
                            onChange={(e) => handleFileUpload(e, docName)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => document.getElementById(`file-${docName}`)?.click()}
                            className={cn(
                              "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer border border-transparent transition-all whitespace-nowrap",
                              uploaded
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                          >
                            {uploaded ? <Check className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                            {uploaded ? 'Change' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-800/40">
                  <button
                    onClick={() => setStep(1)}
                    className="px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back</span>
                  </button>
                  <button
                    onClick={handleSaveDocuments}
                    disabled={isSubmitting || isUploading}
                    className="saas-btn-primary flex-1 justify-center text-[10px]"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Documents & Next'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Bank Details ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-blue-500 shrink-0" /> Step 3: Banking &amp; UPI Details
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Provide bank credentials for direct salary deposits. Verify using Penny Drop simulation.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Holder Name + Bank Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Account Holder Name *</label>
                      <input type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Bank Name *</label>
                      <input type="text" placeholder="e.g. ICICI Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                  </div>

                  {/* Account Number + IFSC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Account Number *</label>
                      <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">IFSC Code *</label>
                      <input type="text" placeholder="e.g. ICIC0000104" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="saas-input w-full p-2.5 font-mono uppercase" />
                    </div>
                  </div>

                  {/* UPI */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">UPI ID (Optional)</label>
                    <input type="text" placeholder="e.g. name@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="saas-input w-full p-2.5 lowercase" />
                  </div>

                  {/* Penny Drop — stacks on mobile */}
                  <div className="p-3 sm:p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div>
                      <p className="text-white font-bold flex items-center gap-1 text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        Simulate Penny Drop Verification
                      </p>
                      <p className="text-[9px] text-slate-500 mt-1">Check credentials via dummy bank transaction instantly.</p>
                    </div>

                    <button
                      type="button"
                      disabled={isPennyDropping || pennyDropSuccess}
                      onClick={handleVerifyBank}
                      className={cn(
                        "w-full sm:w-auto px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer border border-transparent shadow-sm flex items-center justify-center gap-1.5",
                        pennyDropSuccess
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      )}
                    >
                      {isPennyDropping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pennyDropSuccess ? '✓ Verified' : 'Verify Account'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-800/40">
                  <button onClick={() => setStep(2)} className="px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none shrink-0">
                    <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back</span>
                  </button>
                  <button onClick={handleSaveBank} disabled={isSubmitting} className="saas-btn-primary flex-1 justify-center text-[10px]">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Bank Info'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Professional ── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" /> Step 4: Professional Qualifications
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Enter education, work history, key skills, and certifications.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Education + Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Highest Education *</label>
                      <input type="text" placeholder="e.g. Master of Business Administration" value={education} onChange={(e) => setEducation(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Work Experience *</label>
                      <input type="text" placeholder="e.g. 5 Years in Software Engineering" value={experience} onChange={(e) => setExperience(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Skills (Comma Separated) *</label>
                    <input type="text" placeholder="React, TypeScript, Node.js, Project Management" value={skills} onChange={(e) => setSkills(e.target.value)} className="saas-input w-full p-2.5" />
                  </div>

                  {/* LinkedIn + Certifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">LinkedIn Profile URL</label>
                      <input type="text" placeholder="https://linkedin.com/in/username" value={linkedinProfile} onChange={(e) => setLinkedinProfile(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Certifications</label>
                      <input type="text" placeholder="e.g. AWS Solutions Architect, PMP" value={certifications} onChange={(e) => setCertifications(e.target.value)} className="saas-input w-full p-2.5" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-800/40">
                  <button onClick={() => setStep(3)} className="px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none shrink-0">
                    <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back</span>
                  </button>
                  <button onClick={handleSaveProfessional} disabled={isSubmitting} className="saas-btn-primary flex-1 justify-center text-[10px]">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Complete ── */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div className="text-center space-y-2 pt-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Onboarding Submission Successful</h3>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your profile, documents, bank details, and professional credentials have been submitted. HR will review and activate your login account.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Setup Progress Checklist</h4>

                  <div className="space-y-2">
                    {[
                      { label: 'Step 1: Personal Details & Password', badge: 'Completed', done: true },
                      { label: 'Step 2: Verification Documents',       badge: 'Uploaded',  done: true },
                      { label: 'Step 3: Bank Details & UPI',           badge: pennyDropSuccess ? 'Verified' : 'Submitted', done: true },
                      { label: 'Step 4: Professional Qualifications',  badge: 'Submitted', done: true },
                      { label: 'Step 5: Final HR Activation',          badge: 'Pending Review', done: false },
                    ].map((item, idx) => (
                      <div key={idx} className={cn("flex justify-between items-center text-[11px] gap-2", !item.done && "opacity-60")}>
                        <span className="text-slate-400 flex items-center gap-1.5 min-w-0">
                          {item.done
                            ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            : <Loader2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          }
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className={cn(
                          "font-bold uppercase text-[9px] shrink-0",
                          item.done ? "text-emerald-400" : "text-amber-500"
                        )}>{item.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onComplete}
                  className="saas-btn-primary w-full justify-center text-[10px]"
                >
                  Return to Login Panel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
