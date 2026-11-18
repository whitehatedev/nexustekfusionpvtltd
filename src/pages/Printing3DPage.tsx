import React, { useEffect, useMemo, useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2, Box, Layers, Clock, Scale, CreditCard } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { ModelViewer3D } from '../components/ModelViewer3D';
import { AddressSelector } from '../components/AddressSelector';
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';
import { AddressData } from '../types/platform';

interface SlicingResponse {
  upload: {
    fileName: string;
    fileSizeBytes: number;
    fileStoragePath: string;
  };
  slicing: {
    fileFormat: string;
    triangleCount: number;
    boundingBoxMm: { x: number; y: number; z: number };
    volumeCm3: number;
    surfaceAreaCm2: number;
    estimatedWeightG: number;
    supportWeightG: number;
    estimatedPrintMinutes: number;
    layerCount: number;
    technicalReviewRequired: boolean;
    slicingStatus: string;
    warnings: string[];
    pricingBreakdown: {
      materialCostInr: number;
      machineCostInr: number;
      supportCostInr: number;
      wastageCostInr: number;
      labourCostInr: number;
      finishingCostInr: number;
      subtotalInr: number;
      deliveryInr: number;
      gstInr: number;
      discountInr: number;
      totalInr: number;
      technicalReviewRequired: boolean;
      warnings: string[];
    };
  };
  materialName: string;
  machineName: string;
}

export const Printing3DPage: React.FC = () => {
  const {
    isSignedIn,
    signInWithGoogle,
    printingMaterials,
    printingMachines,
    apiFetch,
    notify,
    navigate,
  } = usePlatform();

  const [file, setFile] = useState<File | null>(null);
  const [technology, setTechnology] = useState<'FDM' | 'SLA'>('FDM');
  const [materialId, setMaterialId] = useState<number>(0);
  const [colorName, setColorName] = useState<string>('Black');
  const [layerHeightMm, setLayerHeightMm] = useState<number>(0.2);
  const [infillPercent, setInfillPercent] = useState<number>(20);
  const [supportEnabled, setSupportEnabled] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [finishingOption, setFinishingOption] = useState<string>('Standard As-Printed');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  const [slicingData, setSlicingData] = useState<SlicingResponse | null>(null);
  const [slicingBusy, setSlicingBusy] = useState(false);

  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ id: number; orderNumber: string; totalInr: number; technicalReviewRequired: boolean } | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const filteredMaterials = useMemo(
    () => printingMaterials.filter((m) => m.technology === technology),
    [printingMaterials, technology]
  );

  const activeMaterial = useMemo(
    () => filteredMaterials.find((m) => m.id === materialId) || filteredMaterials[0] || null,
    [filteredMaterials, materialId]
  );

  const activeMachine = useMemo(
    () => printingMachines.find((m) => m.technology === technology) || printingMachines[0] || null,
    [printingMachines, technology]
  );

  useEffect(() => {
    if (activeMaterial) {
      setMaterialId(activeMaterial.id);
      if (activeMaterial.availableColors.length > 0) {
        const hasCurrent = activeMaterial.availableColors.some((c) => c.name === colorName);
        if (!hasCurrent) setColorName(activeMaterial.availableColors[0].name);
      }
      if (activeMaterial.layerHeightsMm.length > 0 && !activeMaterial.layerHeightsMm.includes(layerHeightMm)) {
        setLayerHeightMm(activeMaterial.layerHeightsMm[0]);
      }
    }
  }, [activeMaterial, colorName, layerHeightMm]);

  const loadAddresses = async () => {
    if (!isSignedIn) return;
    try {
      const me = await apiFetch<{ addresses: AddressData[] }>('/api/me');
      setAddresses(me.addresses || []);
      if (!deliveryAddress && me.addresses?.length > 0) {
        setDeliveryAddress(me.addresses.find((a) => a.isDefault) || me.addresses[0]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [isSignedIn]);

  const activeColorHex = useMemo(() => {
    return (
      activeMaterial?.availableColors.find((c) => c.name === colorName)?.hex || '#2563eb'
    );
  }, [activeMaterial, colorName]);

  const runServerSlicing = async (targetFile: File) => {
    if (!isSignedIn) {
      notify('Please sign in to run server-side geometry slicing and pricing.', 'info');
      return;
    }
    setSlicingBusy(true);
    try {
      const fd = new FormData();
      fd.append('model', targetFile);
      fd.append('technology', technology);
      if (activeMaterial) fd.append('materialId', String(activeMaterial.id));
      fd.append('layerHeightMm', String(layerHeightMm));
      fd.append('infillPercent', String(infillPercent));
      fd.append('supportEnabled', String(supportEnabled));
      fd.append('quantity', String(quantity));
      fd.append('finishingOption', finishingOption);

      const res = await apiFetch<SlicingResponse>('/api/3d-printing/slice', {
        method: 'POST',
        body: fd,
      });
      setSlicingData(res);
    } catch (err: any) {
      notify(err?.message || 'Failed to slice uploaded model.', 'error');
    } finally {
      setSlicingBusy(false);
    }
  };

  const handleFileChange = (picked: File | null) => {
    if (!picked) return;
    const ext = picked.name.split('.').pop()?.toLowerCase() || '';
    if (!['stl', 'obj', '3mf', 'step', 'stp'].includes(ext)) {
      notify('Supported formats: STL, OBJ, 3MF, STEP, STP.', 'error');
      return;
    }
    if (picked.size > 80 * 1024 * 1024) {
      notify('Maximum model file size is 80 MB.', 'error');
      return;
    }
    setFile(picked);
    setCreatedOrder(null);
    if (isSignedIn) {
      runServerSlicing(picked);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isSignedIn) {
      await signInWithGoogle();
      return;
    }
    if (!file || !slicingData) {
      notify('Upload a 3D model and generate a slicing estimate first.', 'error');
      return;
    }
    if (!deliveryAddress) {
      notify('Please select or add a delivery address.', 'error');
      return;
    }
    setPlacing(true);
    try {
      const res = await apiFetch<{
        order: { id: number; orderNumber: string; totalInr: number; slicingStatus: string };
      }>('/api/3d-printing/orders', {
        method: 'POST',
        body: JSON.stringify({
          fileName: slicingData.upload.fileName,
          fileStoragePath: slicingData.upload.fileStoragePath,
          technology,
          materialName: activeMaterial?.name,
          colorName,
          layerHeightMm,
          infillPercent,
          supportEnabled,
          quantity,
          finishingOption,
          specialInstructions,
          deliveryAddress,
        }),
      });
      const techReview = res.order.slicingStatus === 'Technical Review Required';
      setCreatedOrder({
        id: res.order.id,
        orderNumber: res.order.orderNumber,
        totalInr: res.order.totalInr,
        technicalReviewRequired: techReview,
      });
      if (!techReview) {
        setPayOpen(true);
      } else {
        notify(`Order ${res.order.orderNumber} queued for Technical Review.`, 'info');
      }
    } catch (err: any) {
      notify(err?.message || 'Could not place 3D printing order.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const pricing = slicingData?.slicing.pricingBreakdown;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">Custom Additive Manufacturing Workbench</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          3D Printing & Rapid Prototyping
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-3xl">
          Upload STL, OBJ, 3MF, or STEP files. Inspect your geometry in 3D, run volumetric server-side slicing, verify pricing, and track production from Nagpur.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive 3D Viewport + Upload + Slicing Output */}
        <div className="lg:col-span-7 space-y-6">
          <ModelViewer3D
            file={file}
            colorHex={activeColorHex}
            buildVolume={
              activeMachine
                ? {
                    x: activeMachine.buildVolumeX,
                    y: activeMachine.buildVolumeY,
                    z: activeMachine.buildVolumeZ,
                  }
                : undefined
            }
            dimensionsMm={slicingData?.slicing.boundingBoxMm || null}
          />

          {/* Drag & Drop File Upload */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileChange(e.dataTransfer.files?.[0] || null);
            }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl bg-white p-5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  {file ? file.name : 'Upload 3D CAD Model (.STL, .OBJ, .3MF, .STEP)'}
                </div>
                <div className="text-xs text-slate-500">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB · Click or drop to replace`
                    : 'Private encrypted storage · Max 80 MB'}
                </div>
              </div>
            </div>
            <span className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap">
              {file ? 'Replace File' : 'Browse File'}
            </span>
            <input
              type="file"
              accept=".stl,.obj,.3mf,.step,.stp"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {/* Real Slicing Output Telemetry */}
          {slicingBusy && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              Running mesh analysis, overhang detection, and volumetric slicing calculation...
            </div>
          )}

          {slicingData && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="font-display font-bold text-slate-950">Slicing & Geometry Report</h2>
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    slicingData.slicing.technicalReviewRequired ? 'text-amber-700' : 'text-blue-700'
                  }`}
                >
                  {slicingData.slicing.technicalReviewRequired ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {slicingData.slicing.slicingStatus}
                </span>
              </div>

              {!slicingData.slicing.technicalReviewRequired && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                    <div className="text-slate-500 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5" /> Dimensions
                    </div>
                    <div className="font-mono font-semibold text-slate-950 tabular-nums">
                      {slicingData.slicing.boundingBoxMm.x} × {slicingData.slicing.boundingBoxMm.y} ×{' '}
                      {slicingData.slicing.boundingBoxMm.z} mm
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                    <div className="text-slate-500 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" /> Filament / Resin
                    </div>
                    <div className="font-mono font-semibold text-slate-950 tabular-nums">
                      {slicingData.slicing.estimatedWeightG} g ({slicingData.slicing.volumeCm3} cm³)
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                    <div className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Est. Print Time
                    </div>
                    <div className="font-mono font-semibold text-slate-950 tabular-nums">
                      {Math.floor(slicingData.slicing.estimatedPrintMinutes / 60)}h{' '}
                      {slicingData.slicing.estimatedPrintMinutes % 60}m
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                    <div className="text-slate-500 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Layers / Facets
                    </div>
                    <div className="font-mono font-semibold text-slate-950 tabular-nums">
                      {slicingData.slicing.layerCount} layers · {slicingData.slicing.triangleCount.toLocaleString()} tris
                    </div>
                  </div>
                </div>
              )}

              {slicingData.slicing.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                  {slicingData.slicing.warnings.map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Print Configuration, Pricing & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-950">Print Configuration</h2>

            {/* Technology */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Printing Technology</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                {(['FDM', 'SLA'] as const).map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setTechnology(tech)}
                    className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                      technology === tech ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {tech === 'FDM' ? 'FDM Engineering Polymer' : 'SLA High-Detail Resin'}
                  </button>
                ))}
              </div>
              {activeMachine && (
                <div className="text-xs text-slate-500 font-mono">
                  Machine: {activeMachine.name} ({activeMachine.buildVolumeX}×{activeMachine.buildVolumeY}×{activeMachine.buildVolumeZ} mm)
                </div>
              )}
            </div>

            {/* Material */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Material</label>
              <select
                value={activeMaterial?.id || ''}
                onChange={(e) => setMaterialId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {filteredMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ₹{m.ratePerGramInr}/g
                  </option>
                ))}
              </select>
              {activeMaterial && (
                <p className="text-xs text-slate-500">{activeMaterial.description}</p>
              )}
            </div>

            {/* Available Colors */}
            {activeMaterial && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Available Colour: <span className="font-semibold text-slate-900">{colorName}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeMaterial.availableColors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColorName(c.name)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                        colorName === c.name
                          ? 'border-blue-700 bg-blue-50 text-blue-950'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Layer Height, Infill, Quantity */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Layer Height</label>
                <select
                  value={layerHeightMm}
                  onChange={(e) => setLayerHeightMm(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm bg-white font-mono"
                >
                  {(activeMaterial?.layerHeightsMm || [0.1, 0.15, 0.2, 0.3]).map((lh) => (
                    <option key={lh} value={lh}>{lh} mm</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Infill %</label>
                <select
                  value={infillPercent}
                  disabled={technology === 'SLA'}
                  onChange={(e) => setInfillPercent(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm bg-white font-mono disabled:opacity-50"
                >
                  {[10, 20, 30, 50, 75, 100].map((inf) => (
                    <option key={inf} value={inf}>{inf}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Finishing</label>
                <select
                  value={finishingOption}
                  onChange={(e) => setFinishingOption(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm bg-white"
                >
                  <option value="Standard As-Printed">Standard As-Printed</option>
                  <option value="Support Removal & Sanding">Support Removal & Sanding</option>
                  <option value="Vapor / Primer Ready">Primer-Ready Finish</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={supportEnabled}
                    onChange={(e) => setSupportEnabled(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Auto-Generate Overhang Supports
                </label>
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Orientation preference, critical tolerances, or thread insert instructions..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            {file && (
              <button
                type="button"
                disabled={slicingBusy}
                onClick={() => (isSignedIn ? runServerSlicing(file) : signInWithGoogle())}
                className="w-full py-2.5 px-4 border border-blue-700 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-lg"
              >
                {isSignedIn ? 'Recalculate Slicing & Price Estimate' : 'Sign In to Calculate Slicing Estimate'}
              </button>
            )}
          </div>

          {/* Transparent Pricing Breakdown */}
          {pricing && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <h3 className="font-display font-bold text-slate-950">Transparent Cost Breakdown</h3>
              {pricing.technicalReviewRequired ? (
                <p className="text-xs text-amber-800 leading-relaxed">
                  Automatic pricing is paused because this file requires Technical Review. Place your order below and our engineer will send a verified quotation.
                </p>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-600 font-mono tabular-nums">
                  <div className="flex justify-between"><span>Material Consumption</span><span>₹{pricing.materialCostInr}</span></div>
                  <div className="flex justify-between"><span>Machine Runtime</span><span>₹{pricing.machineCostInr}</span></div>
                  <div className="flex justify-between"><span>Support Material</span><span>₹{pricing.supportCostInr}</span></div>
                  <div className="flex justify-between"><span>Wastage & Setup</span><span>₹{pricing.wastageCostInr}</span></div>
                  <div className="flex justify-between"><span>Handling & Labour</span><span>₹{pricing.labourCostInr}</span></div>
                  {pricing.finishingCostInr > 0 && (
                    <div className="flex justify-between"><span>Finishing</span><span>₹{pricing.finishingCostInr}</span></div>
                  )}
                  <div className="flex justify-between"><span>Shipping</span><span>₹{pricing.deliveryInr}</span></div>
                  <div className="flex justify-between"><span>GST (18%)</span><span>₹{pricing.gstInr}</span></div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-950">
                    <span>Total Payable</span>
                    <span>₹{pricing.totalInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivery Address & Order Button */}
          {isSignedIn ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <AddressSelector
                title="Delivery Address"
                addresses={addresses}
                selected={deliveryAddress}
                onSelect={setDeliveryAddress}
                onAddressSaved={loadAddresses}
              />

              {createdOrder ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2 text-xs text-[#0B1B3B]">
                  <div className="font-bold">Order {createdOrder.orderNumber} Placed</div>
                  {createdOrder.technicalReviewRequired ? (
                    <p>Queued for engineering review. Track status in My Account.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPayOpen(true)}
                      className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay ₹{createdOrder.totalInr.toLocaleString('en-IN')} Now
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={placing || !slicingData}
                  onClick={handlePlaceOrder}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {placing
                    ? 'Creating Printing Order...'
                    : slicingData?.slicing.technicalReviewRequired
                    ? 'Submit for Engineering Review'
                    : 'Place Printing Order & Pay Online'}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-3">
              <p className="text-sm text-slate-600">Sign in to run server-side slicing, select delivery address, and place your printing order.</p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg"
              >
                Sign In / Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      {createdOrder && (
        <RazorpayCheckoutModal
          open={payOpen}
          onClose={() => setPayOpen(false)}
          entityType="printing_order"
          entityId={createdOrder.id}
          title={`3D Print Order ${createdOrder.orderNumber}`}
          amountInr={createdOrder.totalInr}
          onSuccess={() => navigate('/my-account')}
        />
      )}
    </div>
  );
};
