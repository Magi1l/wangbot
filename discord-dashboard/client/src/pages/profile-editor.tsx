import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProfileCardPreview } from "@/components/profile-card-preview";
import { ColorPicker } from "@/components/color-picker";
import { Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const gradientOptions = [
  { name: "Discord", colors: ["#5865F2", "#FF73FA"] },
  { name: "Nature", colors: ["#3BA55D", "#FEE75C"] },
  { name: "Sunset", colors: ["#FF73FA", "#FEE75C"] },
  { name: "Ocean", colors: ["#3B82F6", "#06B6D4"] },
];

const backgroundOptions = [
  { id: 1, name: "Default Gradient", type: "gradient", value: "linear-gradient(135deg, #5865F2 0%, #FF73FA 100%)" },
  { id: 2, name: "Nature Gradient", type: "gradient", value: "linear-gradient(135deg, #3BA55D 0%, #FEE75C 100%)" },
  { id: 3, name: "Neon Dreams", type: "image", value: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&w=300&h=200&fit=crop" },
  { id: 4, name: "Cyber City", type: "image", value: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&w=300&h=200&fit=crop" },
];

export default function ProfileEditor() {
  const { toast } = useToast();
  const [selectedAccentColor, setSelectedAccentColor] = useState("#5865F2");
  const [selectedGradient, setSelectedGradient] = useState(["#5865F2", "#FF73FA"]);
  const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "프로필 저장 완료!",
      description: "프로필 카드가 성공적으로 저장되었습니다.",
    });
    
    setIsSaving(false);
  };

  const handleFileUpload = () => {
    toast({
      title: "파일 업로드",
      description: "커스텀 배경 업로드 기능이 실행됩니다.",
    });
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="프로필 카드 편집기"
        description="나만의 프로필 카드를 커스터마이징하세요"
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card Preview */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">실시간 미리보기</h3>
            <ProfileCardPreview
              style={{
                accentColor: selectedAccentColor,
                progressGradient: selectedGradient,
                backgroundImage: selectedBackground.type === "image" ? selectedBackground.value : undefined,
                backgroundColor: selectedBackground.type === "gradient" ? selectedBackground.value : undefined,
              }}
            />
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Color Customization */}
            <Card>
              <CardHeader>
                <CardTitle>색상 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-2">포인트 색상</Label>
                  <ColorPicker
                    selectedColor={selectedAccentColor}
                    onColorSelect={setSelectedAccentColor}
                  />
                </div>

                <div>
                  <Label className="text-sm mb-2">진행바 그라데이션</Label>
                  <div className="space-y-2">
                    {gradientOptions.map((gradient, index) => (
                      <button
                        key={index}
                        className="w-full h-8 rounded-lg transition-all hover:scale-105"
                        style={{
                          background: `linear-gradient(to right, ${gradient.colors[0]}, ${gradient.colors[1]})`
                        }}
                        onClick={() => setSelectedGradient(gradient.colors)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background Selection */}
            <Card>
              <CardHeader>
                <CardTitle>배경 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {backgroundOptions.map((background) => (
                    <button
                      key={background.id}
                      className={`h-20 rounded-lg transition-all hover:scale-105 ${
                        selectedBackground.id === background.id ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{
                        background: background.type === "gradient" 
                          ? background.value 
                          : `url(${background.value}) center/cover`
                      }}
                      onClick={() => setSelectedBackground(background)}
                    >
                      {selectedBackground.id === background.id && (
                        <div className="w-full h-full flex items-center justify-center bg-black/30 rounded-lg">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={handleFileUpload}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  커스텀 배경 업로드
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                "저장 중..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  프로필 카드 저장
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
