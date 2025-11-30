import { PromptObject } from "./PromptObject";
import { MusicGenerator } from "./MusicGenerator";
import { ASRQueryController } from "./ASRQueryController";
import { ScrollWindow } from "SpectaclesUIKit.lspkg/Scripts/Components/ScrollWindow/ScrollWindow";
import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import animate from "SpectaclesInteractionKit.lspkg/Utils/animate";
import { SecondaryUIController } from "./SecondaryUIController";

@component
export class SelectionController extends BaseScriptComponent {
  @input
  scrollObjectParent: SceneObject;

  @input
  scrollWindow: ScrollWindow;

  @input
  _generateButton: RectangleButton;

  @input
  musicGenerator: MusicGenerator;

  @input
  asrController: ASRQueryController;

  @input
  secondaryUIController: SecondaryUIController;

  private _promptObjectPrefab: ObjectPrefab = requireAsset(
    "../Prefabs/PromptObj.prefab"
  ) as ObjectPrefab;

  private _promptObjects: PromptObject[] = [];
  private _activeItems: {
    prompt: string;
    emoji: string;
    category: string;
    component: PromptObject;
  }[] = [];
  private _animatingOut: Set<PromptObject> = new Set();

  private _generateBaseScale: vec3;
  private _cancelGenerateAnim: (() => void) | null = null;
  private _isGenerateVisible: boolean = false;
  private _minScrollHeight: number = 0;

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this.scrollWindow.initialize();
      this.scrollWindow.addObject(this.scrollObjectParent);
      this._minScrollHeight = 0;
      this.createObjectPool();
      
      const so = this._generateButton.getSceneObject();
      const tr = so.getTransform();
      this._generateBaseScale = tr.getLocalScale();
      tr.setLocalScale(this._generateBaseScale.uniformScale(0));
      so.enabled = false;
      this._isGenerateVisible = false;
      
      this._generateButton.onInitialized.add(() => {
        this._generateButton.onTriggerUp.add(this._onGenerate.bind(this));
      });
      
      if (this.asrController) {
        this.asrController.onQueryEvent.add((query) => {
          if (query && query.length > 0) {
            this.addToList(query, "🎤");
          }
        });
      }
    });
  }

  addToList(prompt: string, emoji: string) {
    const existingIndex = this._activeItems.findIndex(
      (item) => item.prompt === prompt
    );
    if (existingIndex !== -1) {
      return;
    }

    const category = this.secondaryUIController ? 
      this.secondaryUIController.getCurrentCategory() : "Unknown";

    // Handle Vibe selection
    if (category === "Vibes") {
      const existingVibe = this._activeItems.find(item => item.category === "Vibes");
      if (existingVibe) {
        this.removeFromList(existingVibe.prompt, false);
      }
      
      if (this.secondaryUIController) {
        this.secondaryUIController.setSelectedVibe(prompt);
      }
    }

    // Handle Genres/Instruments selection
    if (category === "Genres" || category === "Instruments") {
      if (this.secondaryUIController) {
        if (!this.secondaryUIController.canAddItem(category)) {
          return;
        }
        
        const lockedCat = this.secondaryUIController.getLockedCategory();
        if (lockedCat === "") {
          this.secondaryUIController.lockCategory(category);
        }
      }
    }

    const freeComponent = this._getAvailablePromptObject();
    if (!freeComponent) {
      return;
    }

    freeComponent.setPrompt(prompt, this._formatDisplayText(prompt, emoji));
    this._activeItems.push({ prompt, emoji, category, component: freeComponent });
    this._sortAndLayoutActiveItems();
    this._updateGenerateButtonEnabled();
    this.scrollWindow.scrollPositionNormalized = new vec2(0, -1);

    if (this.secondaryUIController) {
      this.secondaryUIController.refreshHint();
    }
  }

  removeFromList(prompt: string, animate: boolean = true) {
    const index = this._activeItems.findIndex((item) => item.prompt === prompt);
    if (index === -1) {
      return;
    }

    const item = this._activeItems[index];

    if (item.category === "Vibes" && this.secondaryUIController) {
      this.secondaryUIController.clearVibe();
    }

    if (animate) {
      this._animatingOut.add(item.component);
      item.component.hide();
      return;
    }

    this._activeItems.splice(index, 1);
    this._checkCategoryUnlock();
    this._sortAndLayoutActiveItems();
    this._updateGenerateButtonEnabled();
    this.scrollWindow.scrollPositionNormalized = new vec2(0, -1);

    if (this.secondaryUIController) {
      this.secondaryUIController.refreshHint();
    }
  }

  public onPromptHidden(component: PromptObject) {
    if (!this._animatingOut.has(component)) {
      return;
    }
    this._animatingOut.delete(component);
    
    const idx = this._activeItems.findIndex((it) => it.component === component);
    if (idx !== -1) {
      const item = this._activeItems[idx];
      
      if (item.category === "Vibes" && this.secondaryUIController) {
        this.secondaryUIController.clearVibe();
      }
      
      this._activeItems.splice(idx, 1);
    }
    
    component.hide(true);
    this._checkCategoryUnlock();
    this._sortAndLayoutActiveItems();
    this._updateGenerateButtonEnabled();
    this.scrollWindow.scrollPositionNormalized = new vec2(0, -1);

    if (this.secondaryUIController) {
      this.secondaryUIController.refreshHint();
    }
  }

  private _checkCategoryUnlock() {
    if (!this.secondaryUIController) return;
    
    const lockedCategory = this.secondaryUIController.getLockedCategory();
    if (lockedCategory === "") return;

    const remainingItems = this._activeItems.filter(
      item => item.category === lockedCategory
    );

    if (remainingItems.length === 0) {
      this.secondaryUIController.unlockCategory();
    }
  }

  public getItemCount(): number {
    return this._activeItems.length;
  }

  public getNonVibeItemCount(): number {
    return this._activeItems.filter(item => item.category !== "Vibes").length;
  }

  private createObjectPool() {
    for (let i = 0; i < 30; i++) {
      const promptObject = this._promptObjectPrefab.instantiate(
        this.scrollObjectParent
      );
      const promptObjectComponent = promptObject.getComponent(
        PromptObject.getTypeName()
      );
      promptObjectComponent.init(this);
      this._promptObjects.push(promptObjectComponent);
      promptObjectComponent.hide(true);
    }
    this.scrollWindow.scrollPositionNormalized = new vec2(0, -1);
    this._updateGenerateButtonEnabled();
  }

  private _getAvailablePromptObject(): PromptObject | null {
    for (let i = 0; i < this._promptObjects.length; i++) {
      const candidate = this._promptObjects[i];
      const isInUse = this._activeItems.some(
        (item) => item.component === candidate
      );
      if (!isInUse) {
        return candidate;
      }
    }
    return null;
  }

  private _sortAndLayoutActiveItems() {
    const baseDims = this.scrollWindow.getScrollDimensions();
    const spacing = 0.5;
    const bottomMargin = 2;
    const topMargin = 2;
    
    const visibleActiveItems = this._activeItems.filter(
      (it) => !this._animatingOut.has(it.component)
    );
    
    let contentHeight = 0;
    for (let i = 0; i < visibleActiveItems.length; i++) {
      contentHeight += visibleActiveItems[i].component.getHeight();
      if (i > 0) {
        contentHeight += spacing;
      }
    }
    
    const minHeight = this._minScrollHeight;
    const requiredHeight = Math.max(minHeight, contentHeight + bottomMargin + topMargin);
    this.scrollWindow.setScrollDimensions(new vec2(baseDims.x, requiredHeight));

    const scrollHeight = this.scrollWindow.getScrollDimensions().y;
    const bottomY = -scrollHeight / 2 + bottomMargin;
    const offscreenY = scrollHeight / 2 + 1000;
    let currentY = bottomY;

    for (let i = visibleActiveItems.length - 1; i >= 0; i--) {
      const comp = visibleActiveItems[i].component;
      const height = comp.getHeight();
      comp.sceneObject.getTransform().setLocalPosition(new vec3(0, currentY, 0));
      currentY += height + spacing;
    }

    for (let i = 0; i < this._promptObjects.length; i++) {
      const comp = this._promptObjects[i];
      const isActive = this._activeItems.some((item) => item.component === comp);
      const isAnimatingOut = this._animatingOut.has(comp);
      if (!isActive && !isAnimatingOut) {
        comp.sceneObject.getTransform().setLocalPosition(new vec3(0, offscreenY, 0));
      }
    }
  }

  private _formatDisplayText(prompt: string, emoji: string): string {
    if (emoji && emoji.length > 0) {
      return emoji + " " + prompt;
    }
    return prompt;
  }

  private _onGenerate() {
    if (!this._activeItems.length || !this.musicGenerator) {
      return;
    }

    const vibeItem = this._activeItems.find(item => item.category === "Vibes");
    const otherItems = this._activeItems.filter(item => item.category !== "Vibes");

    if (!vibeItem || otherItems.length < 2) {
      return;
    }

    const vibe = vibeItem.prompt;
    const items = otherItems.map((item) => item.prompt);
    const category = this.secondaryUIController ? 
      this.secondaryUIController.getLockedCategory() : "Genres";
    const bpm = this.secondaryUIController ? 
      this.secondaryUIController.getBPMForVibe() : 90;

    // Call MusicGenerator
    this.musicGenerator.createMusicTracks(vibe, items, category, bpm);

    // Reset list
    for (let i = 0; i < this._activeItems.length; i++) {
      this._activeItems[i].component.hide();
    }
    this._activeItems = [];
    
    if (this.secondaryUIController) {
      this.secondaryUIController.clearVibe();
      this.secondaryUIController.unlockCategory();
    }
    
    this._sortAndLayoutActiveItems();
    this._updateGenerateButtonEnabled();
    this.scrollWindow.scrollPositionNormalized = new vec2(0, -1);
  }

  private _updateGenerateButtonEnabled() {
    if (!this._generateButton) {
      return;
    }

    const hasVibe = this._activeItems.some(item => item.category === "Vibes");
    const nonVibeCount = this._activeItems.filter(item => item.category !== "Vibes").length;
    const canGenerate = hasVibe && nonVibeCount >= 2;

    const so = this._generateButton.getSceneObject();
    const tr = so.getTransform();
    
    if (!this._generateBaseScale) {
      this._generateBaseScale = tr.getLocalScale();
    }
    
    if (canGenerate && !this._isGenerateVisible) {
      if (this._cancelGenerateAnim) {
        this._cancelGenerateAnim();
        this._cancelGenerateAnim = null;
      }
      so.enabled = true;
      tr.setLocalScale(this._generateBaseScale.uniformScale(0));
      this._cancelGenerateAnim = animate({
        duration: 0.5,
        easing: "ease-out-back-cubic",
        update: (t: number) => {
          tr.setLocalScale(this._generateBaseScale.uniformScale(t));
        },
      });
      this._isGenerateVisible = true;
    } else if (!canGenerate && this._isGenerateVisible) {
      if (this._cancelGenerateAnim) {
        this._cancelGenerateAnim();
        this._cancelGenerateAnim = null;
      }
      const base = this._generateBaseScale || new vec3(1, 1, 1);
      this._cancelGenerateAnim = animate({
        duration: 0.5,
        easing: "ease-in-back-cubic",
        update: (t: number) => {
          const k = 1 - t;
          tr.setLocalScale(base.uniformScale(k));
        },
        ended: () => {
          so.enabled = false;
          this._isGenerateVisible = false;
          this._cancelGenerateAnim = null;
        },
      });
    }
  }
}