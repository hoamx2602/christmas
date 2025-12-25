"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChristmasConfig, defaultConfig } from "@/types/config";

interface ConfigPanelProps {
  config: ChristmasConfig;
  onChange: (config: ChristmasConfig) => void;
  cameraEnabled?: boolean;
  onCameraToggle?: () => void;
  drawMode?: boolean;
  onDrawModeToggle?: () => void;
}

export default function ConfigPanel({ config, onChange, cameraEnabled, onCameraToggle, drawMode, onDrawModeToggle }: ConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (key: keyof ChristmasConfig, value: number | boolean | string[]) => {
    onChange({ ...config, [key]: value });
  };

  const resetConfig = () => {
    onChange(defaultConfig);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 bg-black/50 border-white/20 text-white hover:bg-white/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Close" : "Settings"}
      </Button>

      {/* Config Panel */}
      <Card
        className={`fixed top-16 right-4 w-80 max-h-[calc(100vh-100px)] overflow-y-auto z-40 bg-black/80 border-white/20 backdrop-blur-md transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-full pointer-events-none"
        }`}
      >
        <div className="p-4 space-y-6">
          <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
            Settings
          </h2>

          {/* Tree Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-green-400">Tree</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Foliage Density</Label>
                <span className="text-white/60 text-sm">
                  {config.particleCount}
                </span>
              </div>
              <Slider
                value={[config.particleCount]}
                min={1000}
                max={6000}
                step={500}
                onValueChange={([v]) => updateConfig("particleCount", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Foliage Size</Label>
                <span className="text-white/60 text-sm">
                  {config.particleSize.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.particleSize]}
                min={0.05}
                max={0.8}
                step={0.05}
                onValueChange={([v]) => updateConfig("particleSize", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Tree Scale</Label>
                <span className="text-white/60 text-sm">
                  {config.treeScale.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[config.treeScale]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([v]) => updateConfig("treeScale", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Blur</Label>
                <span className="text-white/60 text-sm">
                  {config.blur.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.blur]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => updateConfig("blur", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Twinkle Blur</Label>
                <span className="text-white/60 text-sm">
                  {config.twinkleBlur.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.twinkleBlur]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => updateConfig("twinkleBlur", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Twinkle Size</Label>
                <span className="text-white/60 text-sm">
                  {config.twinkleSize.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.twinkleSize]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => updateConfig("twinkleSize", v)}
              />
            </div>
          </div>

          {/* Star Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-yellow-400">Star</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Star Size</Label>
                <span className="text-white/60 text-sm">
                  {config.starSize.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.starSize]}
                min={0.2}
                max={1.5}
                step={0.1}
                onValueChange={([v]) => updateConfig("starSize", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Star Brightness</Label>
                <span className="text-white/60 text-sm">
                  {config.starBrightness.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.starBrightness]}
                min={0.3}
                max={2}
                step={0.1}
                onValueChange={([v]) => updateConfig("starBrightness", v)}
              />
            </div>
          </div>

          {/* Ornament Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-orange-400">Ornaments</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Ornament Count</Label>
                <span className="text-white/60 text-sm">
                  {config.letterCount} / {config.ornamentImages.length || 0}
                </span>
              </div>
              <Slider
                value={[config.letterCount]}
                min={0}
                max={config.ornamentImages.length || 1}
                step={1}
                onValueChange={([v]) => updateConfig("letterCount", v)}
                disabled={config.ornamentImages.length === 0}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Ornament Size</Label>
                <span className="text-white/60 text-sm">
                  {config.letterSize.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.letterSize]}
                min={0.05}
                max={0.3}
                step={0.01}
                onValueChange={([v]) => updateConfig("letterSize", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Spin Speed</Label>
                <span className="text-white/60 text-sm">
                  {config.letterSpinSpeed.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[config.letterSpinSpeed]}
                min={0}
                max={3}
                step={0.1}
                onValueChange={([v]) => updateConfig("letterSpinSpeed", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Ornament Brightness</Label>
                <span className="text-white/60 text-sm">
                  {config.letterBrightness.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[config.letterBrightness]}
                min={0.3}
                max={2}
                step={0.1}
                onValueChange={([v]) => updateConfig("letterBrightness", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Flow Speed</Label>
                <span className="text-white/60 text-sm">
                  {config.letterFlowSpeed.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[config.letterFlowSpeed]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={([v]) => updateConfig("letterFlowSpeed", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Bevel (Rounded)</Label>
                <span className="text-white/60 text-sm">
                  {config.letterBevel.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.letterBevel]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([v]) => updateConfig("letterBevel", v)}
              />
            </div>
          </div>

          {/* Background Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-purple-400">Background</h3>

            <div className="space-y-2">
              <Label className="text-white/80">Background Color</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { color: "#2a0a0a", name: "Dark Red" },
                  { color: "#050510", name: "Dark Blue" },
                  { color: "#0a1a0a", name: "Dark Green" },
                  { color: "#1a0a1a", name: "Dark Purple" },
                  { color: "#0a0a0a", name: "Black" },
                  { color: "#0f1419", name: "Night" },
                ].map((bg) => (
                  <button
                    key={bg.color}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      config.backgroundColor === bg.color
                        ? "border-white scale-110"
                        : "border-white/30 hover:border-white/60"
                    }`}
                    style={{ backgroundColor: bg.color }}
                    onClick={() => onChange({ ...config, backgroundColor: bg.color })}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Music Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-pink-400">Music</h3>

            <div className="space-y-2">
              <Label className="text-white/80">Select Track</Label>
              <div className="flex flex-col gap-2">
                {[
                  { track: "/music/jingle-bells.mp3", name: "Jingle Bells" },
                  { track: "/music/silent-night.mp3", name: "Silent Night" },
                  { track: "/music/we-wish-you.mp3", name: "We Wish You" },
                  { track: "/music/deck-the-halls.mp3", name: "Deck the Halls" },
                  { track: "/music/christmas.mp3", name: "Christmas" },
                ].map((music) => (
                  <button
                    key={music.track}
                    className={`px-3 py-2 rounded text-left text-sm transition-all ${
                      config.musicTrack === music.track
                        ? "bg-pink-500/30 border border-pink-400 text-white"
                        : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/20"
                    }`}
                    onClick={() => onChange({ ...config, musicTrack: music.track })}
                  >
                    🎵 {music.name}
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-2">
                Add MP3 files to: /public/music/
              </p>
            </div>
          </div>

          {/* Animation Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-blue-400">Animation</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Rotation Speed</Label>
                <span className="text-white/60 text-sm">
                  {config.rotationSpeed.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[config.rotationSpeed]}
                min={0}
                max={0.5}
                step={0.02}
                onValueChange={([v]) => updateConfig("rotationSpeed", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Twinkle Speed</Label>
                <span className="text-white/60 text-sm">
                  {config.twinkleSpeed.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[config.twinkleSpeed]}
                min={1}
                max={10}
                step={0.5}
                onValueChange={([v]) => updateConfig("twinkleSpeed", v)}
              />
            </div>
          </div>

          {/* Interactive Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-emerald-400">Interactive</h3>

            {/* Draw on Snow */}
            {onDrawModeToggle && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Draw on Snow</Label>
                  <Switch
                    checked={drawMode}
                    onCheckedChange={onDrawModeToggle}
                  />
                </div>

                {drawMode && (
                  <div className="text-white/50 text-xs bg-white/5 p-2 rounded">
                    Use mouse to draw on screen. Lines will fade like frost.
                  </div>
                )}
              </>
            )}

            {/* Camera Control */}
            {onCameraToggle && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Hand Gestures</Label>
                  <Switch
                    checked={cameraEnabled}
                    onCheckedChange={onCameraToggle}
                  />
                </div>

                {cameraEnabled && (
                  <div className="text-white/50 text-xs space-y-1 bg-white/5 p-2 rounded">
                    <p>• Move hand: rotate tree</p>
                    <p>• Pinch thumb+index: tap</p>
                    <p>• Pinch thumb+middle: zoom</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Snow Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-cyan-400">Snow</h3>

            <div className="flex items-center justify-between">
              <Label className="text-white/80">Enable Snow</Label>
              <Switch
                checked={config.snowEnabled}
                onCheckedChange={(v) => updateConfig("snowEnabled", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Snow Amount</Label>
                <span className="text-white/60 text-sm">{config.snowCount}</span>
              </div>
              <Slider
                value={[config.snowCount]}
                min={200}
                max={2000}
                step={100}
                onValueChange={([v]) => updateConfig("snowCount", v)}
                disabled={!config.snowEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Fall Speed</Label>
                <span className="text-white/60 text-sm">
                  {config.snowSpeed.toFixed(3)}
                </span>
              </div>
              <Slider
                value={[config.snowSpeed]}
                min={0.005}
                max={0.05}
                step={0.005}
                onValueChange={([v]) => updateConfig("snowSpeed", v)}
                disabled={!config.snowEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Snowflake Size</Label>
                <span className="text-white/60 text-sm">
                  {config.snowSize.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[config.snowSize]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([v]) => updateConfig("snowSize", v)}
                disabled={!config.snowEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-white/80">Wind</Label>
                <span className="text-white/60 text-sm">
                  {config.windDirection > 0
                    ? `Right ${config.windDirection.toFixed(1)}`
                    : config.windDirection < 0
                    ? `Left ${Math.abs(config.windDirection).toFixed(1)}`
                    : "None"}
                </span>
              </div>
              <Slider
                value={[config.windDirection]}
                min={-1}
                max={1}
                step={0.1}
                onValueChange={([v]) => updateConfig("windDirection", v)}
                disabled={!config.snowEnabled}
              />
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={resetConfig}
          >
            Reset to Default
          </Button>

          {/* Instructions */}
          <div className="text-white/50 text-xs space-y-1 pt-2 border-t border-white/10">
            <p>• Scroll to zoom in/out</p>
            <p>• Drag to rotate tree</p>
            <p>• Click ornaments to view photos</p>
            <p>• Add images to: /public/ornaments/</p>
          </div>
        </div>
      </Card>
    </>
  );
}
