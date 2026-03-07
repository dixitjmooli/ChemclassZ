'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { updatePdf } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Save,
  Loader2,
  ExternalLink,
  Link,
  BookOpen,
} from 'lucide-react';

export function PdfManager() {
  const { chapters, pdfs } = useAppStore();
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [hotsPdf, setHotsPdf] = useState<string>('');
  const [topicPdfs, setTopicPdfs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load PDFs when chapter changes
  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const chapterPdf = pdfs.find((p) => p.chapterId === chapterId);
    setHotsPdf(chapterPdf?.hotsPdf || '');
    setTopicPdfs(chapterPdf?.topicPdfs || {});
  };

  const handleTopicPdfChange = (topicId: string, url: string) => {
    setTopicPdfs((prev) => ({ ...prev, [topicId]: url }));
  };

  const handleSave = async () => {
    if (!selectedChapterId) return;

    setIsSaving(true);
    try {
      // Filter out empty URLs
      const filteredTopicPdfs: Record<string, string> = {};
      Object.entries(topicPdfs).forEach(([topicId, url]) => {
        if (url.trim()) {
          filteredTopicPdfs[topicId] = url.trim();
        }
      });

      await updatePdf(
        selectedChapterId,
        hotsPdf.trim() || null,
        Object.keys(filteredTopicPdfs).length > 0 ? filteredTopicPdfs : null
      );

      toast({
        title: 'Saved',
        description: 'PDF links saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save PDF links',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PDF Manager</h1>
        <p className="text-muted-foreground">Add Google Drive PDF links for study materials</p>
      </div>

      {/* Chapter Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Select Chapter</label>
              <Select value={selectedChapterId} onValueChange={handleChapterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      Ch {chapter.chapterNo}: {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Form */}
      {selectedChapter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Chapter Title */}
          <Card className="bg-purple-50 border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <div>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    Chapter {selectedChapter.chapterNo}
                  </Badge>
                  <h2 className="text-lg font-semibold mt-1">{selectedChapter.name}</h2>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topic PDFs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Topic-wise PDFs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedChapter.topics.map((topic) => (
                <div key={topic.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {topic.topicNo}. {topic.name}
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="Google Drive link (optional)"
                      value={topicPdfs[topic.id] || ''}
                      onChange={(e) => handleTopicPdfChange(topic.id, e.target.value)}
                      className="flex-1"
                    />
                    {topicPdfs[topic.id] && (
                      <a
                        href={topicPdfs[topic.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Button variant="outline" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* HOTS PDF */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="w-5 h-5 text-amber-600" />
                HOTS Questions PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Higher Order Thinking Skills PDF Link</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Google Drive link for HOTS questions (optional)"
                    value={hotsPdf}
                    onChange={(e) => setHotsPdf(e.target.value)}
                    className="flex-1"
                  />
                  {hotsPdf && (
                    <a
                      href={hotsPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <Button variant="outline" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save PDF Links
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* No chapter selected */}
      {!selectedChapterId && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="mt-2 text-muted-foreground">
              Select a chapter to manage PDF links
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">How to add Google Drive links:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open your PDF in Google Drive</li>
            <li>Click "Share" → "Get link"</li>
            <li>Change permission to "Anyone with the link"</li>
            <li>Copy the link and paste it above</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
